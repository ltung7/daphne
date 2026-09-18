import { m } from '$lib/paraglide/messages.js';

export const firebaseAuthErrorMap: Record<string, () => string> = {
	'auth/invalid-email': () => m.auth_invalid_email(),
	'auth/user-disabled': () => m.auth_user_disabled(),
	'auth/user-not-found': () => m.auth_user_not_found(),
	'auth/wrong-password': () => m.auth_wrong_password(),
	'auth/email-already-in-use': () => m.auth_email_already_in_use(),
	'auth/weak-password': () => m.auth_weak_password(),
	'auth/operation-not-allowed': () => m.auth_operation_not_allowed(),
	'auth/too-many-requests': () => m.auth_too_many_requests(),
	'auth/network-request-failed': () => m.auth_network_error(),
	'auth/popup-closed-by-user': () => m.auth_popup_closed(),
	'auth/cancelled-popup-request': () => m.auth_popup_closed(),
	'auth/invalid-credential': () => m.auth_invalid_credential(),
	'auth/missing-password': () => m.auth_missing_password(),
	'auth/invalid-verification-code': () => m.auth_invalid_verification_code(),
	'auth/invalid-verification-id': () => m.auth_invalid_verification_id(),
	'auth/expired-action-code': () => m.auth_expired_action_code(),
	'auth/invalid-action-code': () => m.auth_invalid_action_code(),
	'auth/user-token-expired': () => m.auth_session_expired(),
	'auth/invalid-api-key': () => m.auth_invalid_api_key(),
	'auth/auth-domain-config-required': () => m.auth_domain_config_required(),
	'auth/argument-error': () => m.auth_argument_error(),
	'auth/app-not-authorized': () => m.auth_app_not_authorized(),
	'auth/app-deleted': () => m.auth_app_deleted(),
	'auth/keychain-error': () => m.auth_keychain_error(),
	'auth/internal-error': () => m.auth_internal_error(),
	'auth/unauthorized-domain': () => m.auth_unauthorized_domain(),
};

export function getFirebaseAuthErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		const code = (error as { code?: string }).code;
		if (code && firebaseAuthErrorMap[code]) {
			return firebaseAuthErrorMap[code]();
		}
		if (error.message) {
			return error.message;
		}
	}
	return m.auth_login_error();
}