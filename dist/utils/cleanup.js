import { authRepository } from '../repositories/auth.js';
import { logger } from './logger.js';
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 dia
export function startExpiredTokensCleanup() {
    const run = async () => {
        try {
            const deleted = await authRepository.deleteExpiredRefreshTokens();
            logger.info({ deletedCount: deleted.count }, 'Tokens expirados removidos');
        }
        catch (error) {
            logger.error(error, 'Falha ao remover tokens expirados');
        }
    };
    run();
    return setInterval(run, CLEANUP_INTERVAL_MS);
}
