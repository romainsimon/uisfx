import assert from 'node:assert/strict'
import test from 'node:test'
import {
  LEGACY_HOME_RECOVERY_QUERY,
  shouldRecoverLegacyHomepageRedirect,
} from './legacy-home-redirect'

test('recovers the homepage only when the guide was reached through an HTTP redirect', () => {
  assert.equal(shouldRecoverLegacyHomepageRedirect('/ui-sound-design', 1), true)
  assert.equal(shouldRecoverLegacyHomepageRedirect('/ui-sound-design', 0), false)
  assert.equal(shouldRecoverLegacyHomepageRedirect('/', 1), false)
})

test('uses a cache-busting homepage URL distinct from the formerly redirected resource', () => {
  assert.equal(LEGACY_HOME_RECOVERY_QUERY, '?_uisfx_home=1')
})
