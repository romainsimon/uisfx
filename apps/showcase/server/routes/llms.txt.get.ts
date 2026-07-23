import { defineEventHandler } from 'h3'
import { buildLlmsTxt, sendText } from '../utils/agent-docs'

export default defineEventHandler(event => sendText(event, buildLlmsTxt()))
