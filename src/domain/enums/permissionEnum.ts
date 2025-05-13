export enum Permission {
  // --- User Management (Typically HSF Global Admin Permissions) ---
  /** Allows creating new user accounts on the platform. */
  CREATE_USER = 'create_user',
  /** Allows viewing a list of all users on the platform. */
  VIEW_ALL_USERS = 'view_users',
  /** Allows updating the profile of any user on the platform. */
  UPDATE_ANY_USER_PROFILE = 'update_user', // Consider renaming from 'update_user' for clarity
  /** Allows deleting any user account from the platform. */
  DELETE_ANY_USER = 'delete_user', // Consider renaming from 'delete_user' for clarity
  /** Allows managing HSF roles and their assignments to HSF users. */
  MANAGE_HSF_ROLES = 'manage_hsf_roles',
  /** Allows viewing the profile of any user. */
  VIEW_ANY_USER_PROFILE = 'view_any_user_profile',
  /** Allows resetting password for any user. */
  RESET_ANY_USER_PASSWORD = 'reset_any_user_password',

  // --- Organization Management (Typically HSF Global Admin Permissions) ---
  /** Allows creating new organizations (e.g., Developer Companies, Lender Institutions). */
  CREATE_ORGANIZATION = 'create_organization',
  /** Allows viewing all organizations registered on the platform. */
  VIEW_ALL_ORGANIZATIONS = 'view_all_organizations',
  /** Allows editing the profile/details of any organization. */
  EDIT_ANY_ORGANIZATION = 'edit_any_organization',
  /** Allows deleting any organization. */
  DELETE_ANY_ORGANIZATION = 'delete_any_organization',
  /** Allows approving or rejecting pending organization registrations. */
  APPROVE_ORGANIZATION_REGISTRATION = 'approve_organization_registration',
  /** Allows assigning a user as an admin to any organization. */
  ASSIGN_ADMIN_TO_ANY_ORGANIZATION = 'assign_admin_to_any_organization',

  // --- Organization-Specific Management (For Org Admins like DEVELOPER_ADMIN, LENDER_ADMIN) ---
  /** Allows viewing the profile of the organization the user administers. */
  VIEW_OWN_ORGANIZATION_PROFILE = 'view_own_organization_profile',
  /** Allows editing the profile of the organization the user administers. */
  EDIT_OWN_ORGANIZATION_PROFILE = 'edit_own_organization_profile',
  /** Allows managing members (add, remove, assign roles) within their own organization. */
  MANAGE_OWN_ORGANIZATION_MEMBERS = 'manage_own_organization_members',
  /** Allows viewing audit logs specific to their own organization. */
  VIEW_OWN_ORGANIZATION_AUDIT_LOGS = 'view_own_organization_audit_logs',

  // --- Property Listing Management ---
  /** Allows creating a new property listing (typically by a Developer Agent/Admin). */
  CREATE_PROPERTY_LISTING = 'create_property_listing',
  /** Allows editing property listings they created or are directly assigned to. */
  EDIT_OWN_PROPERTY_LISTING = 'edit_own_property_listing',
  /** Allows a DEVELOPER_ADMIN to edit any property listing within their organization. */
  EDIT_ANY_PROPERTY_LISTING_IN_OWN_ORG = 'edit_any_property_listing_in_own_org',
  /** Allows an HSF_ADMIN to edit any property listing on the platform. */
  EDIT_ANY_PROPERTY_LISTING_PLATFORM = 'edit_any_property_listing_platform',
  /** Allows deleting a property listing (subject to role and ownership). */
  DELETE_PROPERTY_LISTING = 'delete_property_listing',
  /** Allows an HSF_ADMIN to view all property listings. */
  VIEW_ALL_PROPERTY_LISTINGS_PLATFORM = 'view_all_property_listings_platform',
  /** Allows users within a Developer Org to view all listings in their org. */
  VIEW_ALL_PROPERTY_LISTINGS_IN_OWN_ORG = 'view_all_property_listings_in_own_org',
  /** Allows HSF staff to approve or reject property listings. */
  APPROVE_PROPERTY_LISTING = 'approve_property_listing',
  /** Allows publishing or unpublishing a property listing. */
  TOGGLE_PROPERTY_LIVE_STATUS = 'toggle_property_live_status',

  // --- Loan Application & Pre-qualification ---
  /** Allows a HOME_BUYER to start/submit a pre-qualification. */
  INITIATE_PREQUALIFICATION = 'initiate_prequalification',
  /** Allows a HOME_BUYER to submit a loan application. */
  SUBMIT_LOAN_APPLICATION = 'submit_loan_application',
  /** Allows a user to view their own loan applications/pre-qualifications. */
  VIEW_OWN_LOAN_APPLICATIONS = 'view_own_loan_applications',
  /** Allows HSF_LOAN_OFFICER or LENDER_LOAN_OFFICER to view applications assigned to them or their queue. */
  VIEW_LOAN_APPLICATIONS_ASSIGNED = 'view_loan_applications_assigned',
  /** Allows HSF_LOAN_OFFICER or LENDER_LOAN_OFFICER to process applications. */
  PROCESS_LOAN_APPLICATION = 'process_loan_application',
  /** Allows an authorized role (e.g., LENDER_UNDERWRITER, HSF_COMPLIANCE_OFFICER) to approve/reject loan applications. */
  DECIDE_LOAN_APPLICATION = 'decide_loan_application', // decide = approve/reject
  /** Allows authorized HSF or Lender staff to generate a loan offer. */
  GENERATE_LOAN_OFFER = 'generate_loan_offer',
  /** Allows a HOME_BUYER to accept or reject a loan offer. */
  ACCEPT_REJECT_LOAN_OFFER = 'accept_reject_loan_offer',

  // --- Inspection Management ---
  /** Allows a HOME_BUYER to request a property inspection. */
  REQUEST_PROPERTY_INSPECTION = 'request_property_inspection',
  /** Allows HSF_INSPECTION_MANAGER or relevant org admin to schedule inspections. */
  SCHEDULE_PROPERTY_INSPECTION = 'schedule_property_inspection',
  /** Allows HSF_INSPECTION_MANAGER to manage overall inspection processes. */
  MANAGE_INSPECTIONS_PLATFORM = 'manage_inspections_platform',
  /** Allows a user (e.g. inspector, agent) to submit an inspection report. */
  SUBMIT_INSPECTION_REPORT = 'submit_inspection_report',

  // --- Document Management ---
  /** Allows users to upload documents related to applications, properties, etc. */
  UPLOAD_DOCUMENT = 'upload_document',
  /** Allows specific roles to approve or reject uploaded documents. */
  APPROVE_DOCUMENT = 'approve_document', // This might need to be more granular, e.g., APPROVE_KYC_DOCUMENT
  /** Allows users to view documents they are permitted to see. */
  VIEW_DOCUMENTS = 'view_documents',

  // --- Payment & Transactions ---
  /** Allows initiating a payment for a service or property. */
  INITIATE_PAYMENT = 'initiate_payment',
  /** Allows viewing transaction history (own or all, depending on role). */
  VIEW_TRANSACTION_HISTORY = 'view_transaction_history',
  /** Allows HSF admins to manage/refund transactions. */
  MANAGE_TRANSACTIONS = 'manage_transactions',

  // --- Communication & Enquiries ---
  /** Allows users to submit enquiries on properties. */
  SUBMIT_ENQUIRY = 'submit_enquiry',
  /** Allows relevant parties (developer, HSF support) to respond to enquiries. */
  RESPOND_TO_ENQUIRY = 'respond_to_enquiry',

  // --- Platform Settings & Reporting (Typically Super Admin / HSF Admin) ---
  /** Allows viewing platform-wide reports and analytics. */
  VIEW_PLATFORM_REPORTS = 'view_platform_reports',
  /** Allows SUPER_ADMIN to manage core platform settings. */
  MANAGE_PLATFORM_SETTINGS = 'manage_platform_settings',
  /** Allows viewing HSF system audit logs. */
  VIEW_HSF_AUDIT_LOGS = 'view_hsf_audit_logs',

  // --- Service Offerings ---
  /** Allows HSF Admins to create new service offerings. */
  CREATE_SERVICE_OFFERING = 'create_service_offering',
  /** Allows HSF Admins to edit existing service offerings. */
  EDIT_SERVICE_OFFERING = 'edit_service_offering',
  /** Allows HSF Admins to activate/deactivate service offerings. */
  TOGGLE_SERVICE_OFFERING_STATUS = 'toggle_service_offering_status',

  // --- Review Requests (Generic, specific types might have their own permissions) ---
  /** Initiate a review request (e.g., for an offer letter). */
  INITIATE_REVIEW_REQUEST = 'initiate_review_request',
  /** Approve a stage in a review request. */
  APPROVE_REVIEW_REQUEST_STAGE = 'approve_review_request_stage',
  /** View all review requests (for admins). */
  VIEW_ALL_REVIEW_REQUESTS = 'view_all_review_requests',
}
