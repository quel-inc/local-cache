import * as core from '@actions/core'
import {exec} from '../utils/cache'

async function run(): Promise<void> {
  try {
    const cacheHit = core.getState('cache-hit')
    const key = core.getState('key')

    if (cacheHit === 'false') {
      const cachePath = core.getState('cache-path')
      const path = core.getState('path')

      await exec(`mkdir -p ${cachePath}`)

      // Check if the target cache directory already exists before moving
      const pathBasename = path.split('/').pop()
      const targetPath = `${cachePath}/${pathBasename}`

      try {
        await exec(`test -d ${targetPath}`)
        core.info(
          `Cache already exists at ${targetPath}, skipping save (likely saved by another parallel job)`
        )
      } catch {
        // Target doesn't exist, proceed with mv
        try {
          const mv = await exec(`mv ./${path} ${cachePath}`)
          core.debug(mv.stdout)
          if (!mv.stderr) {
            core.info(`Cache saved with key ${key}`)
          }
        } catch (mvError) {
          // mv failed (another job may have saved concurrently)
          core.info(
            `Failed to save cache (another job may have saved it concurrently), continuing without error`
          )
        }
      }
    } else {
      core.info(`Cache hit on the key ${key}`)
      core.info(`,not saving cache`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
