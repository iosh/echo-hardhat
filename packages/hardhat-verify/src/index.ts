import { extendConfig, subtask } from 'hardhat/config'
import '@nomicfoundation/hardhat-verify'
import type { VerificationSubtask } from '@nomicfoundation/hardhat-verify'
import { confluxscanConfigExtender } from './internal/config'
import { TASK_VERIFY_CONFLUXSCAN } from './internal/task-names'
import './internal/type-extensions'
import './internal/tasks/confluxscan'

export const TASK_VERIFY_GET_VERIFICATION_SUBTASKS =
  'verify:get-verification-subtasks'

extendConfig(confluxscanConfigExtender)

subtask(
  TASK_VERIFY_GET_VERIFICATION_SUBTASKS,
  async (_, { config }): Promise<VerificationSubtask[]> => {
    const verificationSubtasks: VerificationSubtask[] = []

    if (config.confluxscan.enabled) {
      verificationSubtasks.push({
        label: 'Confluxscan',
        subtaskName: TASK_VERIFY_CONFLUXSCAN,
      })
    }

    if (!config.confluxscan.enabled) {
      console.warn(
        '[WARNING] No verification services are enabled. Please enable at least one verification service in your configuration.',
      )
    }

    return verificationSubtasks
  },
)
