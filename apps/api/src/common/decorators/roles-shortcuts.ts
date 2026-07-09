import { Roles } from '@thallesp/nestjs-better-auth';
import { ADMIN_ROLES, IMPERADOR_ROLES, PORTAL_ROLES, STAFF_ROLES } from '../roles';

export const StaffOnly = () => Roles([...STAFF_ROLES]);
export const AdminOnly = () => Roles([...ADMIN_ROLES]);
export const ImperadorOnly = () => Roles([...IMPERADOR_ROLES]);
export const PortalOnly = () => Roles([...PORTAL_ROLES]);
