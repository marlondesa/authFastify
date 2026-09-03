export const passwordRules = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
};
export function validatePasswordStrength(password) {
    if (password.length < passwordRules.minLength) {
        return { valid: false, message: `Senha deve ter no mínimo ${passwordRules.minLength} caracteres` };
    }
    if (password.length > passwordRules.maxLength) {
        return { valid: false, message: `Senha deve ter no máximo ${passwordRules.maxLength} caracteres` };
    }
    if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
        return { valid: false, message: 'Senha deve conter pelo menos uma letra maiúscula' };
    }
    if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
        return { valid: false, message: 'Senha deve conter pelo menos uma letra minúscula' };
    }
    if (passwordRules.requireNumber && !/\d/.test(password)) {
        return { valid: false, message: 'Senha deve conter pelo menos um número' };
    }
    if (passwordRules.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: 'Senha deve conter pelo menos um caractere especial' };
    }
    return { valid: true };
}
