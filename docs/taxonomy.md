# Semantic cue taxonomy

UI SFX names what happened, not what the sound resembles. Each cue should carry the same intent across every feel pack.

## Input

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `hover` | Fine-pointer discovery on sparse, important controls | Touch interfaces or every item in a dense table |
| `press` | Pointer or key down on a physical-feeling control | The completed action outcome |
| `release` | Pointer or key up, especially press-and-hold controls | Success confirmation |
| `double-click` | A recognized rapid secondary activation | Two unrelated clicks |
| `focus` | A control becomes ready for keyboard or text input | Pointer hover without focus |
| `long-press` | A sustained press reveals a secondary action | An ordinary primary activation |

## Selection

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `select` | Choosing a tab, option, item, or tool | Turning on a binary setting |
| `deselect` | Removing an item from the active set | Closing the surrounding view |
| `toggle-on` | A setting changes from off to on | General selection |
| `toggle-off` | A setting changes from on to off | Errors or blocked settings |
| `check` | A checkbox or task becomes complete | General success across a whole flow |
| `uncheck` | A checkbox or task becomes incomplete | Undoing unrelated content edits |

## Navigation

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `open` | Menus, sheets, panels, detail views | Starting a background process |
| `close` | Dismissing a layer or collapsing detail | Stopping media |
| `back` | Returning to the previous place | Undoing data changes |
| `forward` | Advancing to the next place | Completing a multi-step flow |
| `expand` | Revealing detail inside a collapsed region | Opening a separate navigation layer |
| `collapse` | Returning detail to its compact state | Closing the surrounding view |

## Editing

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `delete` | A destructive removal that has been committed | A removable selection before confirmation |
| `cancel` | Abandoning a pending action without applying it | Closing an ordinary navigation layer |
| `undo` | Reversing the most recent change | Back navigation |
| `redo` | Reapplying a reversed change | Retrying a failed network request |
| `copy` | Placing selected content on the clipboard | Duplicating an object immediately |
| `paste` | Inserting clipboard content | Uploading or importing a file |

## Movement

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `drag-start` | An object lifting into a dragged state | Every pointer move |
| `drop` | A dragged object landing in a valid target | Invalid drops, which need `error` or `blocked` UI |
| `snap` | Alignment, docking, or grid lock | General selection |
| `swipe` | Spatial touch navigation | Ordinary scrolling |
| `reorder` | An item settles into a new sequence position | Every drag movement frame |
| `invalid-drop` | A dragged object cannot land in the target | A general validation error |

## Communication

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `send` | A message or shared object leaves | Upload completion |
| `receive` | A direct response or object arrives | Every background sync |
| `notification` | New, non-urgent information | Warnings or direct mentions |
| `mention` | The user is directly addressed | General activity feeds |
| `typing` | A collaborator begins composing a response | Every local keystroke |
| `reaction` | A lightweight social response is added | A full message notification |

## Feedback

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `success` | An action finishes as expected | Large multi-step completion |
| `error` | An action fails and needs correction | Destructive confirmations |
| `warning` | A consequential state needs review | Routine information |
| `info` | A neutral system fact appears | Every tooltip |
| `blocked` | An action cannot continue in the current state | A recoverable network failure |
| `retry` | A failed action is attempted again | The failure itself |

## Progress

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `start` | Recording, processing, or a session begins | Opening a view |
| `stop` | Recording, processing, or a session ends | A successful result |
| `progress-step` | A discrete step advances inside a longer process | Every animation frame or percentage update |
| `complete` | A multi-step or longer-running process finishes | Every successful click |
| `queued` | Work is accepted and waiting to begin | Work that is already processing |
| `checkpoint` | A meaningful stage in a longer process is saved | Every percentage increment |

## Loops

Loop cues continue until explicitly stopped. Keep them quieter than one-shot feedback and always stop them when the visible state ends.

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `loading` | An interface is fetching or waiting | Long invisible background work |
| `processing` | Sustained generation, rendering, or computation is running | A single completed operation |
| `recording` | Audio or video capture is live | The one-shot start-recording confirmation |
| `connecting` | A device or live session is searching for a connection | The one-shot connected outcome |
| `scanning` | Content or nearby devices are being discovered | An invisible indefinite background task |
| `streaming` | Live data or media continues to flow | Ordinary local playback |

## Media

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `play` | Media begins or resumes playback | Starting an unrelated background process |
| `pause` | Media pauses at its current position | Ending or completing playback |
| `seek` | A scrubber or playhead moves to a new point | Ordinary scrolling |
| `volume-change` | Playback loudness moves to a new level | Every incremental key repeat at full volume |
| `skip-next` | Playback advances to the next item | Seeking within the current item |
| `skip-previous` | Playback returns to the previous item | Back navigation outside media |

## System

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `connect` | A device, service, or live session becomes available | Routine data refreshes |
| `disconnect` | A device, service, or live session goes offline | Errors that need user correction |
| `lock` | Access closes or a protected state engages | Destructive deletion |
| `unlock` | Access opens or a protected state disengages | Generic success feedback |
| `wake` | A dormant device or interface becomes active | Unlocking protected access |
| `sleep` | A device or interface enters a dormant state | Disconnecting from a service |

## Reward

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `reward` | A small unit of value is awarded | Paid transactions |
| `level-up` | Rank or capability increases | Routine progress increments |
| `achievement` | A rare milestone deserves celebration | Frequent task completion |
| `streak` | Repeated participation extends an active streak | A single completed task |
| `badge` | A collectible distinction is awarded | A small repeatable unit of value |
| `bonus` | An unexpected extra reward is revealed | A normal expected completion |

## Commerce

| Cue | Use it for | Do not use it for |
| --- | --- | --- |
| `add-to-cart` | An item enters a cart or pending order | A completed purchase |
| `remove-from-cart` | An item leaves a cart or pending order | Refund confirmation |
| `checkout` | A cart advances into the payment flow | A completed transaction |
| `purchase` | A paid transaction or value exchange completes | Adding an item to a cart |
| `coupon` | A discount or promotional code is accepted | A completed payment |
| `refund` | Value returns after a completed transaction | Removing an unpaid cart item |

## Adding a cue

A new semantic cue must:

1. Describe a distinct interaction outcome that cannot be expressed by an existing cue.
2. Have a visible or haptic counterpart. UI SFX never makes audio the only source of meaning.
3. Work in all ten packs.
4. Include an intended use and a misuse boundary.
5. Keep its non-looping duration below 1.5 seconds.
