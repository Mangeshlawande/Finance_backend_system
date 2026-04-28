import logger from '#config/logger.js';
import { getAllRecords, getRecordById, createRecord, updateRecord, softDeleteRecord } from '#services/records.service.js';
import { formatValidationError } from '#utils/format.js';
import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';
import { createRecordSchema, updateRecordSchema, recordQuerySchema, recordIdSchema } from '#validations/records.validation.js';

// req.orgId is set by requireOrgRole middleware when the route is org-scoped.
// When absent the record is treated as personal (scoped to req.user.id only).

export const fetchAllRecords = asyncHandler(async (req, res) => {
    const parsed = recordQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    const { data, total, page, limit } = await getAllRecords({
        userId: req.user.id,
        orgId:  req.orgId ?? null,
        ...parsed.data,
    });

    res.json(new ApiResponse(200, {
        records: data,
        pagination: {
            total,
            page,
            limit,
            totalPages:  Math.ceil(total / limit),
            hasNextPage: page * limit < total,
        },
    }, 'Records retrieved'));
});

export const fetchRecordById = asyncHandler(async (req, res) => {
    const parsed = recordIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    const record = await getRecordById(parsed.data.id, req.user.id, req.orgId ?? null);
    res.json(new ApiResponse(200, { record }, 'Record retrieved'));
});

export const createNewRecord = asyncHandler(async (req, res) => {
    const parsed = createRecordSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    const record = await createRecord({
        ...parsed.data,
        created_by: req.user.id,
        org_id:     req.orgId ?? null,
    });
    logger.info(`Record ${record.id} created by ${req.user.email}`);
    res.status(201).json(new ApiResponse(201, { record }, 'Record created'));
});

export const updateRecordById = asyncHandler(async (req, res) => {
    const idParsed   = recordIdSchema.safeParse({ id: req.params.id });
    if (!idParsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(idParsed.error));

    const bodyParsed = updateRecordSchema.safeParse(req.body);
    if (!bodyParsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(bodyParsed.error));

    const record = await updateRecord(idParsed.data.id, req.user.id, bodyParsed.data, req.orgId ?? null);
    logger.info(`Record ${idParsed.data.id} updated by ${req.user.email}`);
    res.json(new ApiResponse(200, { record }, 'Record updated'));
});

export const deleteRecordById = asyncHandler(async (req, res) => {
    const parsed = recordIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    await softDeleteRecord(parsed.data.id, req.user.id, req.orgId ?? null);
    logger.info(`Record ${parsed.data.id} deleted by ${req.user.email}`);
    res.json(new ApiResponse(200, {}, 'Record deleted'));
});
