import { Router } from 'express';
import { authenticateToken } from '#middleware/auth.middleware.js';
import {
    createOrg, getMyOrgs, getOrg,
    getMembers, invite, changeMemberRole, leaveOrRemoveMember,
} from '#controllers/organisations.controller.js';

const router = Router();

router.use(authenticateToken);

// Org-level
router.post('/',          createOrg);      // POST   /organisations
router.get('/mine',       getMyOrgs);      // GET    /organisations/mine
router.get('/:orgId',     getOrg);         // GET    /organisations/:orgId

// Member management
router.get( '/:orgId/members',             getMembers);         // GET    /organisations/:orgId/members
router.post('/:orgId/members',             invite);             // POST   /organisations/:orgId/members
router.put( '/:orgId/members/:userId',     changeMemberRole);   // PUT    /organisations/:orgId/members/:userId
router.delete('/:orgId/members/:userId',   leaveOrRemoveMember);// DELETE /organisations/:orgId/members/:userId

export default router;
