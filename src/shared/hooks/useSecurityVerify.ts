import { useState, useCallback } from 'react';
import { gameApi } from '../api/game-api';
import { startAuthentication } from '@simplewebauthn/browser';

type VerifyMethod = 'none' | 'passkey' | 'pin' | 'setup-pin';

interface SecurityState {
  isVerifying: boolean;
  showPinInput: boolean;
  showPinSetup: boolean;
  pinError: string;
  attemptsRemaining: number;
  blocked: boolean;
}

/**
 * Hook xu ly xac nhan bao mat: van tay -> fallback PIN.
 * Dung truoc khi goi /send hoac /export.
 */
export function useSecurityVerify() {
  const [state, setState] = useState<SecurityState>({
    isVerifying: false,
    showPinInput: false,
    showPinSetup: false,
    pinError: '',
    attemptsRemaining: 5,
    blocked: false,
  });

  /**
   * Bat dau verify. Return method de FE biet hien UI nao.
   */
  const verify = useCallback(async (): Promise<{
    method: VerifyMethod;
    pin?: string;
    verified: boolean;
  }> => {
    setState(s => ({ ...s, isVerifying: true, pinError: '', blocked: false }));

    try {
      // 1. Check security status
      const status = await gameApi.getSecurityStatus();
      const { hasPin, hasPasskey } = status;

      // 2. Chua cai gi -> bat setup PIN
      if (!hasPin && !hasPasskey) {
        setState(s => ({ ...s, isVerifying: false }));
        return { method: 'setup-pin', verified: false };
      }

      // 3. Co passkey -> thu van tay truoc
      if (hasPasskey) {
        try {
          const options = await gameApi.getPasskeyTxOptions();
          const assertion = await startAuthentication({ optionsJSON: options });
          const result = await gameApi.verifyPasskeyTx(assertion);

          if (result.verified) {
            setState(s => ({ ...s, isVerifying: false }));
            return { method: 'passkey', verified: true };
          }
        } catch (passkeyErr) {
          // Passkey failed (cancel, sensor error) -> fallback PIN
          console.log('[Security] Passkey failed, falling back to PIN:', (passkeyErr as Error).message);
        }
      }

      // 4. Fallback PIN (hoac PIN only)
      if (hasPin) {
        setState(s => ({ ...s, isVerifying: false }));
        return { method: 'pin', verified: false };
      }

      // 5. Co passkey nhung fail, khong co PIN -> yeu cau setup PIN
      setState(s => ({ ...s, isVerifying: false }));
      return { method: 'setup-pin', verified: false };

    } catch (err) {
      console.error('[Security] Verify error:', err);
      setState(s => ({ ...s, isVerifying: false }));
      return { method: 'none', verified: false };
    }
  }, []);

  /**
   * Verify PIN (goi sau khi user nhap trong PinInputModal)
   */
  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const data = await gameApi.verifyWalletPin(pin);

      if (data.valid) {
        setState(s => ({ ...s, pinError: '', blocked: false, attemptsRemaining: 5 }));
        return true;
      }

      setState(s => ({
        ...s,
        pinError: 'Mã PIN không đúng',
        attemptsRemaining: data.attemptsRemaining,
        blocked: data.blocked,
      }));
      return false;
    } catch (err: any) {
      const isBlocked = err?.status === 429;
      setState(s => ({
        ...s,
        pinError: isBlocked ? 'Đã nhập sai quá 5 lần' : 'Xác nhận thất bại',
        blocked: isBlocked,
      }));
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isVerifying: false,
      showPinInput: false,
      showPinSetup: false,
      pinError: '',
      attemptsRemaining: 5,
      blocked: false,
    });
  }, []);

  return {
    ...state,
    verify,
    verifyPin,
    reset,
    setShowPinInput: (v: boolean) => setState(s => ({ ...s, showPinInput: v })),
    setShowPinSetup: (v: boolean) => setState(s => ({ ...s, showPinSetup: v })),
  };
}
