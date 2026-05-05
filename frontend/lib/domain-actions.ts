export type ClipboardAdapter = {
  writeText(text: string): Promise<void>;
};

export async function copyDomainWithFallback({
  clipboard,
  domain,
  fallback
}: {
  clipboard: ClipboardAdapter | undefined;
  domain: string;
  fallback: (domain: string) => boolean;
}): Promise<boolean> {
  try {
    const copied = await copyDomainToClipboard(clipboard, domain);
    if (copied) {
      return true;
    }
  } catch {
    // Continue into the synchronous fallback path below.
  }
  return fallback(domain);
}

export async function copyDomainToClipboard(
  clipboard: ClipboardAdapter | undefined,
  domain: string
): Promise<boolean> {
  if (!clipboard?.writeText) {
    return false;
  }
  await clipboard.writeText(domain);
  return true;
}

export function copyDomainMessage(domain: string): string {
  return `Copied ${domain}.`;
}

export function copyDomainErrorMessage(domain: string): string {
  return `Couldn't copy ${domain}.`;
}

export function saveDomainMessage(domain: string): string {
  return `Saved ${domain}.`;
}
