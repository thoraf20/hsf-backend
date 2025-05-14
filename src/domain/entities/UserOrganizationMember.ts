import { BaseEntity } from '.';

export class UserOrganizationMember extends BaseEntity {
  user_id: string;
  organization_id: string;
  role_id: string;

  constructor(data: Partial<UserOrganizationMember>) {
    super();
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    });
  }
}
