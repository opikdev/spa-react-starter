export type AppPage = { path: string; heading: string };

export const publicPages: AppPage[] = [
  { path: '/login', heading: 'Log in' },
  { path: '/register', heading: 'Create your account' },
];

export const signedInPages: AppPage[] = [
  { path: '/notes', heading: 'Your notes' },
  { path: '/notes/new', heading: 'New note' },
  { path: '/notes/$noteId', heading: 'Edit note' },
];

export function pageUrl(path: string, params: Record<string, string>): string {
  return path.replace(/\$(\w+)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`No value for $${name} in ${path}`);
    return value;
  });
}
