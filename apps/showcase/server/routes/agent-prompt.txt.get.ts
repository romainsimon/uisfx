import { defineEventHandler } from 'h3'
import { buildAgentImplementationPrompt } from '../../shared/agent-docs'
import { sendText } from '../utils/agent-docs'

export default defineEventHandler((event) => sendText(event, buildAgentImplementationPrompt()))
