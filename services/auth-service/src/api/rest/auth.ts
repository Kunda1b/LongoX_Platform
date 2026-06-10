import { Router, type IRouter } from "express";
import { PostgresUserRepository } from "../../infrastructure/postgres/user-repository";
import { createAuthMiddleware } from "../../infrastructure/auth/middleware";
import { LoginCommand } from "../../application/commands/login.command";
import { GetCurrentUserQuery } from "../../application/queries/get-current-user.query";

const router: IRouter = Router();
const repository = new PostgresUserRepository();
const login = new LoginCommand(repository);
const getCurrentUser = new GetCurrentUserQuery(repository);
const authMiddleware = createAuthMiddleware(repository);

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  const result = await login.execute({
    email: email ?? "",
    password: password ?? "",
  });
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json({ token: result.token, user: result.user });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const profile = await getCurrentUser.execute(req.user!.id);
  if (!profile) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(profile);
});

export default router;
