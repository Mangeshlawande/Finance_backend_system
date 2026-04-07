import logger from '#config/logger.js';
import { getAllRecords, getRecordById, createRecord, updateRecord, softDeleteRecord } from '#services/records.service.js';
import { formatValidationError } from '#utils/format.js';
import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';
import { createRecordSchema, updateRecordSchema, recordQuerySchema, recordIdSchema } from '#validations/records.validation.js';

export const fetchAllRecords = asyncHandler(async (req, res) => {
    const parsed = recordQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    try {
        const { data, total, page, limit } = await getAllRecords(parsed.data);
        res.json(new ApiResponse(200, {
            records: data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
            },
        }, 'Records retrieved'));
    } catch (error) {
        throw new ApiError(
            503,
            error || "Server Error while getting records !"
        )
    }
});

export const fetchRecordById = asyncHandler(async (req, res) => {
    const parsed = recordIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));
    try {

        const record = await getRecordById(parsed.data.id);
        res.json(new ApiResponse(200, { record }, 'Record retrieved'));

    } catch (error) {
        throw new ApiError(
            502,
            error || "Something went wrong while getting Records !!",
        );
    }
});

export const createNewRecord = asyncHandler(async (req, res) => {
    const parsed = createRecordSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));
    try {

        const record = await createRecord({ ...parsed.data, created_by: req.user.id });
        logger.info(`Record ${record.id} created by ${req.user.email}`);
        res.status(201).json(new ApiResponse(201, { record }, 'Record created'));

    } catch (error) {
        throw new ApiError(
            503,
            error || "Something went wrong while Creating Records !!",
        );
    }
});

export const updateRecordById = asyncHandler(async (req, res) => {
    const idParsed = recordIdSchema.safeParse({ id: req.params.id });
    if (!idParsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(idParsed.error));

    const bodyParsed = updateRecordSchema.safeParse(req.body);
    if (!bodyParsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(bodyParsed.error));

    try {

        const record = await updateRecord(idParsed.data.id, bodyParsed.data);
        logger.info(`Record ${idParsed.data.id} updated by ${req.user.email}`);
        res.json(new ApiResponse(200, { record }, 'Record updated'));

    } catch (error) {
        throw new ApiError(
            505,
            error || "Something went wrong while Updating Records !!",
        );
    }
});

export const deleteRecordById = asyncHandler(async (req, res) => {
    const parsed = recordIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    try {

        await softDeleteRecord(parsed.data.id);
        logger.info(`Record ${parsed.data.id} deleted by ${req.user.email}`);
        res.json(new ApiResponse(200, {}, 'Record deleted'));

    } catch (error) {
        throw new ApiError(
            503,
            error || "Something went wrong while Deleting Records !!",
        );
    }
});
