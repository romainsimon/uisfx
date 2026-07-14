export const LEGACY_HOME_RECOVERY_PARAMETER = '_uisfx_home'
export const LEGACY_HOME_RECOVERY_QUERY = `?${LEGACY_HOME_RECOVERY_PARAMETER}=1`

export function shouldRecoverLegacyHomepageRedirect(pathname: string, redirectCount: number) {
  return pathname === '/ui-sound-design' && redirectCount > 0
}
