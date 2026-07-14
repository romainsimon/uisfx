interface ScrollspySection<Id extends string> {
  id: Id
  top: number
}

export function findActiveSection<Id extends string>(
  sections: readonly ScrollspySection<Id>[],
  readingLine: number,
) {
  let active = sections[0]?.id
  for (const section of sections) {
    if (section.top > readingLine) break
    active = section.id
  }
  return active
}
