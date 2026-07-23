export const CATEGORIES = [
  { id: 'input', label: 'Input', description: 'Pointer, key, and touch contact.' },
  { id: 'selection', label: 'Selection', description: 'Choosing, switching, and changing state.' },
  { id: 'navigation', label: 'Navigation', description: 'Moving through views and layers.' },
  { id: 'editing', label: 'Editing', description: 'Changing work with reversible and destructive actions.' },
  { id: 'movement', label: 'Movement', description: 'Dragging, snapping, and spatial gestures.' },
  { id: 'communication', label: 'Communication', description: 'Messages and attention.' },
  { id: 'feedback', label: 'Feedback', description: 'Clear outcomes and system status.' },
  { id: 'progress', label: 'Progress', description: 'Processes from start to finish.' },
  { id: 'loops', label: 'Loops', description: 'Continuous state while work, capture, or connection is active.' },
  { id: 'media', label: 'Media', description: 'Playback, seeking, and listening controls.' },
  { id: 'system', label: 'System', description: 'Connections, access, and device state.' },
  { id: 'reward', label: 'Reward', description: 'Milestones, value, and celebration.' },
  { id: 'commerce', label: 'Commerce', description: 'Cart, checkout, and value exchange.' },
] as const

export type CategoryName = (typeof CATEGORIES)[number]['id']

export interface PatternNote {
  at: number
  semitone: number
  length: number
  glide?: number
  gain?: number
}

export interface CueDefinition {
  name: string
  label: string
  category: CategoryName
  description: string
  duration: number
  baseMidi: number
  notes: readonly PatternNote[]
  noise?: number
  transient?: number
  panFrom?: number
  panTo?: number
  loop?: boolean
  defaultVolume: number
}

export const CUES = [
  { name: 'hover', label: 'Hover', category: 'input', description: 'Fine-pointer discovery without commitment.', duration: 0.12, baseMidi: 78, notes: [{ at: 0, semitone: 0, length: 0.09 }], noise: 0.04, defaultVolume: 0.12 },
  { name: 'press', label: 'Press', category: 'input', description: 'A control is physically engaged.', duration: 0.16, baseMidi: 62, notes: [{ at: 0, semitone: 3, length: 0.13, glide: -4 }], noise: 0.14, transient: 0.5, defaultVolume: 0.2 },
  { name: 'release', label: 'Release', category: 'input', description: 'A pressed control springs back.', duration: 0.18, baseMidi: 68, notes: [{ at: 0.01, semitone: -2, length: 0.14, glide: 4 }], noise: 0.06, transient: 0.3, defaultVolume: 0.18 },
  { name: 'double-click', label: 'Double click', category: 'input', description: 'A rapid secondary activation.', duration: 0.24, baseMidi: 72, notes: [{ at: 0, semitone: 0, length: 0.07 }, { at: 0.105, semitone: 2, length: 0.08 }], transient: 0.5, defaultVolume: 0.2 },
  { name: 'focus', label: 'Focus', category: 'input', description: 'A control becomes ready for keyboard or text input.', duration: 0.2, baseMidi: 74, notes: [{ at: 0, semitone: -2, length: 0.15, glide: 3 }], noise: 0.03, defaultVolume: 0.12 },
  { name: 'long-press', label: 'Long press', category: 'input', description: 'A sustained press reveals a secondary action.', duration: 0.46, baseMidi: 58, notes: [{ at: 0, semitone: 0, length: 0.34, glide: 5 }, { at: 0.28, semitone: 7, length: 0.13, gain: 0.5 }], noise: 0.08, transient: 0.32, defaultVolume: 0.18 },

  { name: 'select', label: 'Select', category: 'selection', description: 'An item enters the active set.', duration: 0.28, baseMidi: 70, notes: [{ at: 0, semitone: 0, length: 0.12 }, { at: 0.09, semitone: 7, length: 0.16 }], defaultVolume: 0.2 },
  { name: 'deselect', label: 'Deselect', category: 'selection', description: 'An item leaves the active set.', duration: 0.25, baseMidi: 70, notes: [{ at: 0, semitone: 7, length: 0.11 }, { at: 0.085, semitone: 0, length: 0.14 }], defaultVolume: 0.17 },
  { name: 'toggle-on', label: 'Toggle on', category: 'selection', description: 'A binary setting becomes active.', duration: 0.32, baseMidi: 67, notes: [{ at: 0, semitone: 0, length: 0.13 }, { at: 0.105, semitone: 7, length: 0.19 }], transient: 0.25, defaultVolume: 0.2 },
  { name: 'toggle-off', label: 'Toggle off', category: 'selection', description: 'A binary setting becomes inactive.', duration: 0.3, baseMidi: 67, notes: [{ at: 0, semitone: 7, length: 0.12 }, { at: 0.1, semitone: 0, length: 0.17 }], transient: 0.25, defaultVolume: 0.18 },
  { name: 'check', label: 'Check', category: 'selection', description: 'A checkbox or task enters its completed state.', duration: 0.31, baseMidi: 71, notes: [{ at: 0, semitone: 0, length: 0.12 }, { at: 0.09, semitone: 5, length: 0.18 }], transient: 0.2, defaultVolume: 0.17 },
  { name: 'uncheck', label: 'Uncheck', category: 'selection', description: 'A checkbox or task returns to its incomplete state.', duration: 0.28, baseMidi: 71, notes: [{ at: 0, semitone: 5, length: 0.11 }, { at: 0.085, semitone: 0, length: 0.16 }], transient: 0.18, defaultVolume: 0.15 },

  { name: 'delete', label: 'Delete', category: 'editing', description: 'A destructive removal is committed.', duration: 0.48, baseMidi: 58, notes: [{ at: 0, semitone: 6, length: 0.2, glide: -7 }, { at: 0.16, semitone: -2, length: 0.24, gain: 0.6 }], noise: 0.18, transient: 0.5, defaultVolume: 0.22 },
  { name: 'cancel', label: 'Cancel', category: 'editing', description: 'A pending action is abandoned without applying.', duration: 0.34, baseMidi: 64, notes: [{ at: 0, semitone: 3, length: 0.25, glide: -5 }], noise: 0.06, defaultVolume: 0.17 },
  { name: 'undo', label: 'Undo', category: 'editing', description: 'The most recent change is reversed.', duration: 0.44, baseMidi: 67, notes: [{ at: 0, semitone: 5, length: 0.2, glide: -5 }, { at: 0.18, semitone: 0, length: 0.2, gain: 0.7 }], panFrom: 0.45, panTo: -0.45, defaultVolume: 0.18 },
  { name: 'redo', label: 'Redo', category: 'editing', description: 'A reversed change is applied again.', duration: 0.44, baseMidi: 67, notes: [{ at: 0, semitone: 0, length: 0.2 }, { at: 0.18, semitone: 5, length: 0.2, glide: 2, gain: 0.75 }], panFrom: -0.45, panTo: 0.45, defaultVolume: 0.18 },
  { name: 'copy', label: 'Copy', category: 'editing', description: 'Selected content is placed on the clipboard.', duration: 0.3, baseMidi: 70, notes: [{ at: 0, semitone: 0, length: 0.14 }, { at: 0.1, semitone: 12, length: 0.15, gain: 0.48 }], panFrom: -0.2, panTo: 0.2, defaultVolume: 0.15 },
  { name: 'paste', label: 'Paste', category: 'editing', description: 'Clipboard content is inserted into the current context.', duration: 0.34, baseMidi: 67, notes: [{ at: 0, semitone: 7, length: 0.14 }, { at: 0.11, semitone: 0, length: 0.19, gain: 0.72 }], transient: 0.18, defaultVolume: 0.17 },

  { name: 'open', label: 'Open', category: 'navigation', description: 'A menu, sheet, panel, or detail view appears.', duration: 0.36, baseMidi: 64, notes: [{ at: 0, semitone: 0, length: 0.26, glide: 7 }, { at: 0.12, semitone: 7, length: 0.19, gain: 0.55 }], noise: 0.06, defaultVolume: 0.18 },
  { name: 'close', label: 'Close', category: 'navigation', description: 'A menu, sheet, panel, or detail view recedes.', duration: 0.33, baseMidi: 64, notes: [{ at: 0, semitone: 7, length: 0.23, glide: -7 }, { at: 0.1, semitone: 0, length: 0.17, gain: 0.45 }], noise: 0.05, defaultVolume: 0.17 },
  { name: 'back', label: 'Back', category: 'navigation', description: 'Navigation returns to the previous place.', duration: 0.3, baseMidi: 66, notes: [{ at: 0, semitone: 3, length: 0.23, glide: -5 }], noise: 0.08, panFrom: 0.35, panTo: -0.55, defaultVolume: 0.17 },
  { name: 'forward', label: 'Forward', category: 'navigation', description: 'Navigation advances to the next place.', duration: 0.3, baseMidi: 66, notes: [{ at: 0, semitone: -2, length: 0.23, glide: 5 }], noise: 0.08, panFrom: -0.35, panTo: 0.55, defaultVolume: 0.17 },
  { name: 'expand', label: 'Expand', category: 'navigation', description: 'A collapsed region reveals more detail.', duration: 0.36, baseMidi: 64, notes: [{ at: 0, semitone: 0, length: 0.22, glide: 5 }, { at: 0.15, semitone: 7, length: 0.17, gain: 0.55 }], panFrom: 0, panTo: 0.35, defaultVolume: 0.16 },
  { name: 'collapse', label: 'Collapse', category: 'navigation', description: 'An expanded region returns to its compact state.', duration: 0.34, baseMidi: 64, notes: [{ at: 0, semitone: 7, length: 0.2, glide: -5 }, { at: 0.13, semitone: 0, length: 0.16, gain: 0.5 }], panFrom: 0.35, panTo: 0, defaultVolume: 0.15 },

  { name: 'drag-start', label: 'Drag start', category: 'movement', description: 'An object lifts from its resting place.', duration: 0.28, baseMidi: 57, notes: [{ at: 0, semitone: -2, length: 0.22, glide: 6 }], noise: 0.14, transient: 0.3, defaultVolume: 0.18 },
  { name: 'drop', label: 'Drop', category: 'movement', description: 'A dragged object lands in a valid target.', duration: 0.28, baseMidi: 55, notes: [{ at: 0, semitone: 5, length: 0.18, glide: -7 }, { at: 0.07, semitone: 0, length: 0.17, gain: 0.45 }], noise: 0.18, transient: 0.6, defaultVolume: 0.22 },
  { name: 'snap', label: 'Snap', category: 'movement', description: 'An object locks into a precise position.', duration: 0.16, baseMidi: 73, notes: [{ at: 0, semitone: 0, length: 0.1 }, { at: 0.045, semitone: 12, length: 0.08, gain: 0.45 }], transient: 0.75, defaultVolume: 0.2 },
  { name: 'swipe', label: 'Swipe', category: 'movement', description: 'A touch gesture moves content spatially.', duration: 0.38, baseMidi: 69, notes: [{ at: 0.02, semitone: -4, length: 0.29, glide: 8, gain: 0.55 }], noise: 0.32, panFrom: -0.7, panTo: 0.7, defaultVolume: 0.14 },
  { name: 'reorder', label: 'Reorder', category: 'movement', description: 'An item settles into a new position in a sequence.', duration: 0.32, baseMidi: 61, notes: [{ at: 0, semitone: 7, length: 0.13, glide: -4 }, { at: 0.12, semitone: 0, length: 0.16 }], noise: 0.1, transient: 0.38, defaultVolume: 0.18 },
  { name: 'invalid-drop', label: 'Invalid drop', category: 'movement', description: 'A dragged object cannot land in the current target.', duration: 0.39, baseMidi: 59, notes: [{ at: 0, semitone: 1, length: 0.16 }, { at: 0.16, semitone: -2, length: 0.18, glide: -2 }], noise: 0.16, transient: 0.3, defaultVolume: 0.19 },

  { name: 'send', label: 'Send', category: 'communication', description: 'A message or object leaves the user.', duration: 0.42, baseMidi: 69, notes: [{ at: 0, semitone: -2, length: 0.28, glide: 9 }, { at: 0.19, semitone: 12, length: 0.16, gain: 0.6 }], noise: 0.16, panFrom: -0.2, panTo: 0.5, defaultVolume: 0.2 },
  { name: 'receive', label: 'Receive', category: 'communication', description: 'A response or object arrives.', duration: 0.46, baseMidi: 72, notes: [{ at: 0, semitone: 7, length: 0.28, glide: -5 }, { at: 0.2, semitone: 0, length: 0.19, gain: 0.7 }], noise: 0.08, panFrom: 0.45, panTo: 0, defaultVolume: 0.2 },
  { name: 'notification', label: 'Notification', category: 'communication', description: 'New information is available, without urgency.', duration: 0.58, baseMidi: 72, notes: [{ at: 0, semitone: 0, length: 0.26 }, { at: 0.19, semitone: 5, length: 0.3 }], defaultVolume: 0.2 },
  { name: 'mention', label: 'Mention', category: 'communication', description: 'The user is directly addressed.', duration: 0.64, baseMidi: 74, notes: [{ at: 0, semitone: 0, length: 0.18 }, { at: 0.16, semitone: 4, length: 0.18 }, { at: 0.32, semitone: 9, length: 0.25 }], defaultVolume: 0.22 },
  { name: 'typing', label: 'Typing', category: 'communication', description: 'A collaborator begins composing a response.', duration: 0.32, baseMidi: 73, notes: [{ at: 0, semitone: 0, length: 0.06 }, { at: 0.1, semitone: 2, length: 0.06 }, { at: 0.2, semitone: 0, length: 0.07 }], noise: 0.07, transient: 0.25, defaultVolume: 0.1 },
  { name: 'reaction', label: 'Reaction', category: 'communication', description: 'A lightweight social response is added.', duration: 0.38, baseMidi: 75, notes: [{ at: 0, semitone: 0, length: 0.15 }, { at: 0.11, semitone: 7, length: 0.21 }], transient: 0.16, defaultVolume: 0.17 },

  { name: 'success', label: 'Success', category: 'feedback', description: 'An action finished with the expected result.', duration: 0.72, baseMidi: 67, notes: [{ at: 0, semitone: 0, length: 0.3 }, { at: 0.16, semitone: 4, length: 0.32 }, { at: 0.33, semitone: 7, length: 0.33 }], defaultVolume: 0.23 },
  { name: 'error', label: 'Error', category: 'feedback', description: 'An action failed and needs attention.', duration: 0.62, baseMidi: 62, notes: [{ at: 0, semitone: 6, length: 0.28 }, { at: 0.22, semitone: 0, length: 0.32, glide: -2 }], noise: 0.1, defaultVolume: 0.22 },
  { name: 'warning', label: 'Warning', category: 'feedback', description: 'A risky or consequential state needs review.', duration: 0.68, baseMidi: 65, notes: [{ at: 0, semitone: 0, length: 0.22 }, { at: 0.28, semitone: 0, length: 0.3 }], transient: 0.2, defaultVolume: 0.22 },
  { name: 'info', label: 'Info', category: 'feedback', description: 'A neutral system fact is surfaced.', duration: 0.42, baseMidi: 70, notes: [{ at: 0, semitone: 0, length: 0.34, glide: 2 }], defaultVolume: 0.16 },
  { name: 'blocked', label: 'Blocked', category: 'feedback', description: 'An action cannot continue in the current state.', duration: 0.43, baseMidi: 57, notes: [{ at: 0, semitone: 1, length: 0.14 }, { at: 0.15, semitone: 1, length: 0.22, glide: -3 }], noise: 0.14, transient: 0.44, defaultVolume: 0.2 },
  { name: 'retry', label: 'Retry', category: 'feedback', description: 'A failed action is attempted again.', duration: 0.42, baseMidi: 64, notes: [{ at: 0, semitone: -2, length: 0.17, glide: 4 }, { at: 0.16, semitone: 5, length: 0.21 }], noise: 0.06, defaultVolume: 0.18 },

  { name: 'start', label: 'Start', category: 'progress', description: 'A process, recording, or session begins.', duration: 0.45, baseMidi: 60, notes: [{ at: 0, semitone: 0, length: 0.22 }, { at: 0.16, semitone: 7, length: 0.24 }], noise: 0.05, defaultVolume: 0.19 },
  { name: 'stop', label: 'Stop', category: 'progress', description: 'A process, recording, or session ends.', duration: 0.38, baseMidi: 60, notes: [{ at: 0, semitone: 5, length: 0.18 }, { at: 0.13, semitone: 0, length: 0.2 }], noise: 0.08, defaultVolume: 0.19 },
  { name: 'progress-step', label: 'Progress step', category: 'progress', description: 'A discrete step advances inside a longer process.', duration: 0.24, baseMidi: 72, notes: [{ at: 0, semitone: 0, length: 0.16, glide: 2 }], noise: 0.03, defaultVolume: 0.12 },
  { name: 'complete', label: 'Complete', category: 'progress', description: 'A multi-step process reaches its final state.', duration: 0.88, baseMidi: 65, notes: [{ at: 0, semitone: 0, length: 0.24 }, { at: 0.18, semitone: 4, length: 0.25 }, { at: 0.36, semitone: 7, length: 0.26 }, { at: 0.54, semitone: 12, length: 0.28 }], defaultVolume: 0.24 },
  { name: 'queued', label: 'Queued', category: 'progress', description: 'Work is accepted and waiting to begin.', duration: 0.36, baseMidi: 64, notes: [{ at: 0, semitone: 0, length: 0.14 }, { at: 0.13, semitone: 2, length: 0.18, gain: 0.65 }], noise: 0.04, defaultVolume: 0.14 },
  { name: 'checkpoint', label: 'Checkpoint', category: 'progress', description: 'A meaningful stage in a longer process is saved.', duration: 0.5, baseMidi: 69, notes: [{ at: 0, semitone: 0, length: 0.18 }, { at: 0.14, semitone: 5, length: 0.18 }, { at: 0.28, semitone: 9, length: 0.17, gain: 0.6 }], defaultVolume: 0.18 },

  { name: 'loading', label: 'Loading', category: 'loops', description: 'A quiet repeating pulse while an interface fetches or waits.', duration: 1.2, baseMidi: 72, notes: [{ at: 0, semitone: 0, length: 0.16 }, { at: 0.3, semitone: 2, length: 0.16 }, { at: 0.6, semitone: 4, length: 0.16 }, { at: 0.9, semitone: 7, length: 0.16 }], loop: true, defaultVolume: 0.1 },
  { name: 'processing', label: 'Processing', category: 'loops', description: 'A restrained repeating bed while sustained work is running.', duration: 1.6, baseMidi: 62, notes: [{ at: 0.02, semitone: 0, length: 0.24 }, { at: 0.4, semitone: 5, length: 0.2, gain: 0.7 }, { at: 0.8, semitone: 2, length: 0.24 }, { at: 1.2, semitone: 7, length: 0.2, gain: 0.7 }], loop: true, noise: 0.05, defaultVolume: 0.08 },
  { name: 'recording', label: 'Recording', category: 'loops', description: 'A calm periodic pulse while audio or video capture is live.', duration: 1.0, baseMidi: 67, notes: [{ at: 0.02, semitone: 0, length: 0.2 }, { at: 0.5, semitone: 0, length: 0.14, gain: 0.45 }], loop: true, transient: 0.08, defaultVolume: 0.09 },
  { name: 'connecting', label: 'Connecting', category: 'loops', description: 'A repeating search pattern while a device or live session connects.', duration: 1.5, baseMidi: 69, notes: [{ at: 0.02, semitone: 0, length: 0.18 }, { at: 0.36, semitone: 4, length: 0.18 }, { at: 0.72, semitone: 7, length: 0.2 }, { at: 1.08, semitone: 4, length: 0.16, gain: 0.55 }], loop: true, panFrom: -0.3, panTo: 0.3, defaultVolume: 0.09 },
  { name: 'scanning', label: 'Scanning', category: 'loops', description: 'A spatial sweep repeats while content or devices are discovered.', duration: 1.4, baseMidi: 72, notes: [{ at: 0.03, semitone: -5, length: 0.28, glide: 8, gain: 0.55 }, { at: 0.7, semitone: 3, length: 0.28, glide: -8, gain: 0.45 }], loop: true, noise: 0.12, panFrom: -0.65, panTo: 0.65, defaultVolume: 0.075 },
  { name: 'streaming', label: 'Streaming', category: 'loops', description: 'A quiet repeating flow while live data or media continues.', duration: 1.2, baseMidi: 65, notes: [{ at: 0.02, semitone: 0, length: 0.2 }, { at: 0.3, semitone: 7, length: 0.16, gain: 0.5 }, { at: 0.6, semitone: 2, length: 0.2 }, { at: 0.9, semitone: 9, length: 0.16, gain: 0.5 }], loop: true, noise: 0.08, panFrom: -0.2, panTo: 0.2, defaultVolume: 0.07 },

  { name: 'play', label: 'Play', category: 'media', description: 'Media playback begins or resumes.', duration: 0.34, baseMidi: 67, notes: [{ at: 0, semitone: 0, length: 0.16 }, { at: 0.12, semitone: 7, length: 0.18 }], transient: 0.2, defaultVolume: 0.18 },
  { name: 'pause', label: 'Pause', category: 'media', description: 'Media playback pauses at the current position.', duration: 0.32, baseMidi: 67, notes: [{ at: 0, semitone: 4, length: 0.11 }, { at: 0.13, semitone: 4, length: 0.13 }], transient: 0.25, defaultVolume: 0.17 },
  { name: 'seek', label: 'Seek', category: 'media', description: 'The playback position moves to a new point.', duration: 0.3, baseMidi: 72, notes: [{ at: 0, semitone: -3, length: 0.22, glide: 6, gain: 0.65 }], noise: 0.2, panFrom: -0.55, panTo: 0.55, defaultVolume: 0.13 },
  { name: 'volume-change', label: 'Volume change', category: 'media', description: 'Playback loudness moves to a new level.', duration: 0.2, baseMidi: 76, notes: [{ at: 0, semitone: 0, length: 0.14, glide: 2 }], noise: 0.04, defaultVolume: 0.11 },
  { name: 'skip-next', label: 'Skip next', category: 'media', description: 'Playback advances to the next item.', duration: 0.3, baseMidi: 70, notes: [{ at: 0, semitone: 0, length: 0.11 }, { at: 0.1, semitone: 7, length: 0.15 }, { at: 0.18, semitone: 12, length: 0.08, gain: 0.5 }], panFrom: -0.35, panTo: 0.55, defaultVolume: 0.16 },
  { name: 'skip-previous', label: 'Skip previous', category: 'media', description: 'Playback returns to the previous item.', duration: 0.3, baseMidi: 70, notes: [{ at: 0, semitone: 12, length: 0.1, gain: 0.5 }, { at: 0.08, semitone: 7, length: 0.13 }, { at: 0.17, semitone: 0, length: 0.1 }], panFrom: 0.55, panTo: -0.35, defaultVolume: 0.16 },

  { name: 'connect', label: 'Connect', category: 'system', description: 'A device, service, or live session becomes available.', duration: 0.62, baseMidi: 64, notes: [{ at: 0, semitone: 0, length: 0.24 }, { at: 0.19, semitone: 7, length: 0.24 }, { at: 0.36, semitone: 12, length: 0.2, gain: 0.55 }], defaultVolume: 0.2 },
  { name: 'disconnect', label: 'Disconnect', category: 'system', description: 'A device, service, or live session goes offline.', duration: 0.58, baseMidi: 64, notes: [{ at: 0, semitone: 12, length: 0.21 }, { at: 0.18, semitone: 5, length: 0.22 }, { at: 0.34, semitone: 0, length: 0.18, gain: 0.6 }], noise: 0.06, defaultVolume: 0.19 },
  { name: 'lock', label: 'Lock', category: 'system', description: 'Access closes or a protected state engages.', duration: 0.34, baseMidi: 55, notes: [{ at: 0, semitone: 4, length: 0.14, glide: -4 }, { at: 0.11, semitone: 0, length: 0.17, gain: 0.7 }], transient: 0.55, defaultVolume: 0.2 },
  { name: 'unlock', label: 'Unlock', category: 'system', description: 'Access opens or a protected state disengages.', duration: 0.42, baseMidi: 62, notes: [{ at: 0, semitone: 0, length: 0.17 }, { at: 0.13, semitone: 7, length: 0.23, glide: 2 }], transient: 0.3, defaultVolume: 0.2 },
  { name: 'wake', label: 'Wake', category: 'system', description: 'A device or dormant interface becomes active.', duration: 0.46, baseMidi: 61, notes: [{ at: 0, semitone: -5, length: 0.31, glide: 9 }, { at: 0.24, semitone: 7, length: 0.16, gain: 0.45 }], noise: 0.06, defaultVolume: 0.17 },
  { name: 'sleep', label: 'Sleep', category: 'system', description: 'A device or interface enters a dormant state.', duration: 0.48, baseMidi: 61, notes: [{ at: 0, semitone: 7, length: 0.26, glide: -7 }, { at: 0.21, semitone: -2, length: 0.2, gain: 0.5 }], noise: 0.08, defaultVolume: 0.15 },

  { name: 'reward', label: 'Reward', category: 'reward', description: 'The user receives a small unit of value.', duration: 0.64, baseMidi: 76, notes: [{ at: 0, semitone: 0, length: 0.22 }, { at: 0.1, semitone: 12, length: 0.24 }, { at: 0.26, semitone: 7, length: 0.29 }], transient: 0.35, defaultVolume: 0.22 },
  { name: 'level-up', label: 'Level up', category: 'reward', description: 'Capability, rank, or progression increases.', duration: 0.92, baseMidi: 64, notes: [{ at: 0, semitone: 0, length: 0.24 }, { at: 0.17, semitone: 4, length: 0.25 }, { at: 0.34, semitone: 7, length: 0.26 }, { at: 0.51, semitone: 12, length: 0.32 }], defaultVolume: 0.25 },
  { name: 'achievement', label: 'Achievement', category: 'reward', description: 'A rare milestone deserves a fuller celebration.', duration: 1.16, baseMidi: 62, notes: [{ at: 0, semitone: 0, length: 0.34 }, { at: 0.16, semitone: 7, length: 0.34 }, { at: 0.34, semitone: 12, length: 0.38 }, { at: 0.56, semitone: 16, length: 0.42 }, { at: 0.73, semitone: 19, length: 0.38 }], defaultVolume: 0.26 },
  { name: 'streak', label: 'Streak', category: 'reward', description: 'Repeated participation extends an active streak.', duration: 0.72, baseMidi: 69, notes: [{ at: 0, semitone: 0, length: 0.17 }, { at: 0.14, semitone: 2, length: 0.18 }, { at: 0.28, semitone: 4, length: 0.19 }, { at: 0.43, semitone: 7, length: 0.21 }], defaultVolume: 0.21 },
  { name: 'badge', label: 'Badge', category: 'reward', description: 'A collectible distinction is awarded.', duration: 0.78, baseMidi: 71, notes: [{ at: 0, semitone: 0, length: 0.2 }, { at: 0.13, semitone: 7, length: 0.23 }, { at: 0.31, semitone: 12, length: 0.35 }], transient: 0.2, defaultVolume: 0.22 },
  { name: 'bonus', label: 'Bonus', category: 'reward', description: 'An unexpected extra reward is revealed.', duration: 0.86, baseMidi: 66, notes: [{ at: 0, semitone: 0, length: 0.18 }, { at: 0.12, semitone: 4, length: 0.19 }, { at: 0.25, semitone: 9, length: 0.23 }, { at: 0.43, semitone: 16, length: 0.34 }], transient: 0.3, defaultVolume: 0.24 },

  { name: 'add-to-cart', label: 'Add to cart', category: 'commerce', description: 'An item enters a cart or pending order.', duration: 0.48, baseMidi: 70, notes: [{ at: 0, semitone: 0, length: 0.16 }, { at: 0.14, semitone: 7, length: 0.25 }], transient: 0.25, defaultVolume: 0.19 },
  { name: 'remove-from-cart', label: 'Remove from cart', category: 'commerce', description: 'An item leaves a cart or pending order.', duration: 0.43, baseMidi: 70, notes: [{ at: 0, semitone: 7, length: 0.15 }, { at: 0.13, semitone: 0, length: 0.22 }], transient: 0.2, defaultVolume: 0.17 },
  { name: 'checkout', label: 'Checkout', category: 'commerce', description: 'A cart advances into the payment flow.', duration: 0.66, baseMidi: 65, notes: [{ at: 0, semitone: 0, length: 0.22 }, { at: 0.18, semitone: 5, length: 0.23 }, { at: 0.35, semitone: 9, length: 0.24 }], defaultVolume: 0.2 },
  { name: 'purchase', label: 'Purchase', category: 'commerce', description: 'A paid transaction or value exchange completes.', duration: 0.76, baseMidi: 69, notes: [{ at: 0, semitone: -5, length: 0.12 }, { at: 0.11, semitone: 0, length: 0.24 }, { at: 0.28, semitone: 7, length: 0.32 }], noise: 0.12, transient: 0.55, defaultVolume: 0.22 },
  { name: 'coupon', label: 'Coupon', category: 'commerce', description: 'A discount or promotional code is accepted.', duration: 0.52, baseMidi: 72, notes: [{ at: 0, semitone: 0, length: 0.16 }, { at: 0.13, semitone: 4, length: 0.18 }, { at: 0.26, semitone: 9, length: 0.21 }], transient: 0.16, defaultVolume: 0.18 },
  { name: 'refund', label: 'Refund', category: 'commerce', description: 'Value returns after a completed transaction.', duration: 0.7, baseMidi: 67, notes: [{ at: 0, semitone: 7, length: 0.24 }, { at: 0.19, semitone: 2, length: 0.25 }, { at: 0.39, semitone: 0, length: 0.23, gain: 0.65 }], panFrom: 0.35, panTo: -0.2, defaultVolume: 0.2 },
] as const satisfies readonly CueDefinition[]

export type CueName = (typeof CUES)[number]['name']
export type PlaybackMode = 'one-shot' | 'loop'

export interface PackDefinition {
  name: string
  label: string
  description: string
  bestFor: string
  color: string
  waveform: 'sine' | 'triangle' | 'square' | 'saw'
  pitch: number
  duration: number
  attack: number
  decay: number
  noise: number
  transient: number
  brightness: number
  echo: number
  bitDepth: number
  harmonics: readonly [number, number][]
  paper?: number
  brush?: number
  wood?: number
  chime?: number
}

export const PACKS = [
  { name: 'minimal', label: 'Minimal', description: 'Dry, precise, almost invisible.', bestFor: 'Productivity, SaaS, system UI', color: '#e84d2a', waveform: 'sine', pitch: 1, duration: 0.78, attack: 0.004, decay: 2.3, noise: 0.05, transient: 0.15, brightness: 0.78, echo: 0, bitDepth: 16, harmonics: [[1, 1], [2, 0.08]] },
  { name: 'soft', label: 'Soft', description: 'Rounded felt, warm and reassuring.', bestFor: 'Mobile, wellness, friendly SaaS', color: '#d47b83', waveform: 'triangle', pitch: 0.9, duration: 1.08, attack: 0.012, decay: 1.65, noise: 0.08, transient: 0.08, brightness: 0.46, echo: 0.04, bitDepth: 16, harmonics: [[1, 1], [2, 0.14], [3, 0.04]] },
  { name: 'glass', label: 'Glass', description: 'Bright, crystalline, and premium.', bestFor: 'Media, finance, luxury products', color: '#4c8ca5', waveform: 'sine', pitch: 1.22, duration: 1.22, attack: 0.003, decay: 1.32, noise: 0.025, transient: 0.12, brightness: 0.95, echo: 0.09, bitDepth: 16, harmonics: [[1, 1], [2.72, 0.28], [4.19, 0.11], [6.8, 0.05]] },
  { name: 'arcade', label: 'Arcade', description: 'Chunky pixels and cheerful voltage.', bestFor: 'Games, streaks, gamified learning', color: '#7257d9', waveform: 'square', pitch: 1.08, duration: 0.86, attack: 0.002, decay: 1.1, noise: 0.035, transient: 0.2, brightness: 0.72, echo: 0.025, bitDepth: 8, harmonics: [[1, 1], [2, 0.08]] },
  { name: 'mechanical', label: 'Mechanical', description: 'Switches, relays, and firm detents.', bestFor: 'Devtools, hardware, industrial UI', color: '#68736f', waveform: 'triangle', pitch: 0.74, duration: 0.72, attack: 0.001, decay: 2.8, noise: 0.24, transient: 0.72, brightness: 0.58, echo: 0.015, bitDepth: 12, harmonics: [[1, 1], [1.5, 0.13], [2.1, 0.08]] },
  { name: 'organic', label: 'Organic', description: 'Wood, water, breath, and small stones.', bestFor: 'Education, kids, calm games', color: '#718b4e', waveform: 'sine', pitch: 0.94, duration: 1.12, attack: 0.008, decay: 1.85, noise: 0.18, transient: 0.28, brightness: 0.4, echo: 0.055, bitDepth: 16, harmonics: [[1, 1], [1.48, 0.18], [2.02, 0.09], [3.05, 0.035]] },
  { name: 'dreamy', label: 'Dreamy', description: 'Airy blooms, soft light, and slow sparkle.', bestFor: 'Creative tools, wellness, ambient apps', color: '#a36cad', waveform: 'sine', pitch: 1.05, duration: 1.18, attack: 0.02, decay: 1.42, noise: 0.045, transient: 0.045, brightness: 0.56, echo: 0.13, bitDepth: 16, harmonics: [[1, 1], [2, 0.12], [3.01, 0.07], [5.02, 0.025]] },
  { name: 'scifi', label: 'Sci-fi', description: 'Holographic scans and electric data chirps.', bestFor: 'AI tools, spatial UI, futuristic games', color: '#20a29d', waveform: 'saw', pitch: 1.18, duration: 0.92, attack: 0.003, decay: 1.38, noise: 0.09, transient: 0.34, brightness: 0.92, echo: 0.08, bitDepth: 12, harmonics: [[1, 1], [2, 0.16], [4, 0.055]] },
  { name: 'rubber', label: 'Rubber', description: 'Elastic pops, bounces, and friendly squish.', bestFor: 'Kids, playful mobile, casual games', color: '#d99a24', waveform: 'triangle', pitch: 0.88, duration: 1, attack: 0.006, decay: 1.1, noise: 0.05, transient: 0.38, brightness: 0.62, echo: 0.035, bitDepth: 16, harmonics: [[1, 1], [1.5, 0.12], [2, 0.08]] },
  { name: 'cinematic', label: 'Cinematic', description: 'Deep impacts, polished tails, and quiet scale.', bestFor: 'Premium media, games, dramatic moments', color: '#3f5873', waveform: 'sine', pitch: 0.7, duration: 1.28, attack: 0.008, decay: 1.78, noise: 0.12, transient: 0.55, brightness: 0.38, echo: 0.11, bitDepth: 16, harmonics: [[1, 1], [0.5, 0.22], [2, 0.1], [3, 0.035]] },
  { name: 'studio', label: 'Studio', description: 'Tactile editing precision with warm cinematic restraint.', bestFor: 'Film, audio, and AI creative tools', color: '#6261a8', waveform: 'triangle', pitch: 0.86, duration: 0.82, attack: 0.004, decay: 2.15, noise: 0.09, transient: 0.24, brightness: 0.48, echo: 0.025, bitDepth: 16, harmonics: [[1, 1], [2, 0.11], [3, 0.035]] },
  { name: 'zen', label: 'Zen', description: 'Washi folds, soft brush, and quiet wooden detail.', bestFor: 'Mindfulness, reading, writing, calm productivity', color: '#7d8f77', waveform: 'sine', pitch: 0.86, duration: 1.02, attack: 0.012, decay: 2.05, noise: 0, transient: 0.045, brightness: 0.34, echo: 0.018, bitDepth: 16, harmonics: [[1, 1], [2.01, 0.075], [3.98, 0.018]], paper: 0.34, brush: 0.26, wood: 0.22, chime: 0.12 },
] as const satisfies readonly PackDefinition[]

export type PackName = (typeof PACKS)[number]['name']

export const cueNames = CUES.map((cue) => cue.name) as CueName[]
export const packNames = PACKS.map((pack) => pack.name) as PackName[]

export function getCue(name: CueName): CueDefinition {
  const cue = CUES.find((candidate) => candidate.name === name)
  if (!cue) throw new Error(`Unknown UI SFX cue: ${name}`)
  return cue
}

export function getPlaybackMode(name: CueName): PlaybackMode {
  return getCue(name).loop ? 'loop' : 'one-shot'
}

export function getPack(name: PackName): PackDefinition {
  const pack = PACKS.find((candidate) => candidate.name === name)
  if (!pack) throw new Error(`Unknown UI SFX pack: ${name}`)
  return pack
}
