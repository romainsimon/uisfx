# UI SFX listening conformance

Automated signal checks catch clipping, dirty tails, broken loop seams, timing drift, and overly similar waveforms. They cannot determine whether a cue feels clear, tiring, intrusive, or appropriate beside speech and media. Every release that changes recipes must complete this listening pass.

## Test panel

Use at least three listeners:

- one product designer or researcher
- one engineer who regularly ships interface behavior
- one sound designer, editor, musician, or experienced media creator

Listeners should not be told which pack is expected to perform best.

## Playback contexts

Test the candidate library in every context below:

| Context | Required check |
| --- | --- |
| Phone speaker | Frequent cues remain audible without becoming sharp or dominant. |
| Laptop speaker | Outcomes remain distinct at ordinary system volume. |
| Closed headphones | Stereo movement is useful and never disorienting. |
| Quiet room | Tails, noise beds, clicks, and repetition fatigue are easy to detect. |
| Speech or screen reader | Interface cues do not mask spoken information. |
| Music or video playback | Important outcomes remain legible without competing with primary media. |

Respect the device's silent mode and volume during every pass. Sound must always accompany an equivalent visible state, and haptics may reinforce but never replace that state.

## Tasks

### Meaning and contrast

Run real interface flows for selection, navigation, editing, feedback, progress, system state, reward, and commerce. For each flow, compare the intended cue with its closest semantic neighbor, such as `select` versus `check`, `success` versus `complete`, or `blocked` versus `error`.

Pass when all listeners can explain which state changed without relying on volume alone.

### Repetition and silence

Repeat `hover`, `focus`, `typing`, `progress-step`, and `volume-change` 30 times at their intended cadence. Then use the same interface for five minutes with sound enabled.

Pass when no listener asks to lower the frequent cues, reports fatigue, or finds that silence would communicate the interaction better.

### Loops

Run every loop for two minutes on phone speakers and headphones. Switch packs while each loop is active, then stop it and play success, error, and cancellation outcomes.

Pass when timing remains stable, the pack change has no silent gap or layered duplicate, and the loop stops immediately with a short fade.

### Pack identity

Audition the same five cues in all twelve packs. Each pack should feel coherent across cues while remaining clearly different from the other packs. The interaction meaning must remain stable when the pack changes.

## Scorecard

Each listener scores four dimensions from 1 to 5:

1. semantic clarity
2. hierarchy and restraint
3. repetition comfort
4. context compatibility

A release passes only when:

- no individual score is below 4
- every dimension averages at least 4.5
- every blocking comment has been resolved and retested
- the automated PCM, encoded-audio, package, unit, and browser gates also pass

Record the devices, operating systems, browsers, assistive technology, listeners, scores, and resolved findings in the release notes.
