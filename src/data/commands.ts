import { profile, sections } from './profile'
import { work } from './work'

export type Command = {
  id: string
  label: string
  hint?: string
  group: 'Sections' | 'Projects' | 'Links' | 'Actions'
  keywords?: string[]
  /** What happens on Enter. Resolved in CommandPalette. */
  action:
    | { type: 'scroll'; target: string }
    | { type: 'route'; to: string }
    | { type: 'href'; url: string; external?: boolean }
    | { type: 'toggle-motion' }
    | { type: 'copy'; text: string }
}

export const commands: Command[] = [
  ...sections.map<Command>((s) => ({
    id: `section-${s.id}`,
    label: s.label,
    hint: s.id === 'top' ? 'g h' : `g ${s.key}`,
    group: 'Sections',
    keywords: ['go', 'section', s.short],
    action: { type: 'scroll', target: `#${s.id}` },
  })),
  ...work.map<Command>((w) => ({
    id: `work-${w.slug}`,
    label: w.title,
    hint: w.hook,
    group: 'Projects',
    keywords: [...w.stack, w.type, 'case study', 'project'],
    action: { type: 'route', to: `/work/${w.slug}` },
  })),
  { id: 'gh', label: 'GitHub', hint: profile.githubHandle, group: 'Links', keywords: ['code', 'repos'], action: { type: 'href', url: profile.github, external: true } },
  { id: 'li', label: 'LinkedIn', hint: profile.linkedinHandle, group: 'Links', keywords: ['profile'], action: { type: 'href', url: profile.linkedin, external: true } },
  { id: 'mail', label: 'Email', hint: profile.email, group: 'Links', keywords: ['contact', 'mailto'], action: { type: 'href', url: `mailto:${profile.email}` } },
  { id: 'cv', label: 'Résumé (PDF)', hint: 'download', group: 'Links', keywords: ['resume', 'cv', 'pdf'], action: { type: 'href', url: profile.resume, external: true } },
  { id: 'motion', label: 'Toggle reduced motion', hint: 'reloads', group: 'Actions', keywords: ['animation', 'a11y', 'prefers'], action: { type: 'toggle-motion' } },
  { id: 'copy', label: 'Copy email', hint: profile.email, group: 'Actions', keywords: ['clipboard'], action: { type: 'copy', text: profile.email } },
  { id: 'src', label: 'View source', hint: 'this site', group: 'Actions', keywords: ['github', 'repo', 'portfolio'], action: { type: 'href', url: profile.repo, external: true } },
]
