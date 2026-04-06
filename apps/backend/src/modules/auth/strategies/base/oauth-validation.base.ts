export type StrategyDone = (err: any, user?: any) => void;

type ValidationPayload = {
  email?: string;
  missingEmailMessage: string;
};

type ValidationHandlers<TUser> = {
  resolveUser: (payload: { email: string }) => Promise<TUser>;
  done: StrategyDone;
};

export async function runOAuthValidation<TUser>(payload: ValidationPayload, handlers: ValidationHandlers<TUser>) {
  try {
    if (!payload.email) {
      throw new Error(payload.missingEmailMessage);
    }

    const user = await handlers.resolveUser({ email: payload.email });
    handlers.done(null, user);
  } catch (err) {
    handlers.done(err, false);
  }
}
