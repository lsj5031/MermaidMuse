export type RuntimeEnv = Record<string, string | undefined>;

type NodeProcessLike = {
  env?: RuntimeEnv;
};

export function getRuntimeEnv(override?: RuntimeEnv): RuntimeEnv {
  if (override) return override;

  const env =
    ((globalThis as unknown as { process?: NodeProcessLike }).process?.env as
      | RuntimeEnv
      | undefined) ?? {};

  return env;
}
