function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicSupabaseEnvironment() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!anonKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (!url) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL",
    );
  }

  return {
    anonKey,
    url,
  };
}

export function getAdminSupabaseEnvironment() {
  const publicEnvironment = getPublicSupabaseEnvironment();

  return {
    serviceRoleKey: requireEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY"),
    url: publicEnvironment.url,
  };
}
