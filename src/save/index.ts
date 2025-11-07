import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'

async function run(): Promise<void> {
  try {
    const cacheHit = core.getState('cache-hit')
    const key = core.getState('key')

    if (cacheHit === 'false') {
      const cachePath = core.getState('cache-path')
      const sourcePath = core.getState('path')

      // Create cache directory if it doesn't exist (using fs API)
      await fs.promises.mkdir(cachePath, {recursive: true})

      // Get basename safely using Node.js path module
      const pathBasename = path.basename(sourcePath)
      const targetPath = path.join(cachePath, pathBasename)

      // Check if the target cache directory already exists
      if (fs.existsSync(targetPath)) {
        core.info(
          `Cache already exists at ${targetPath}, skipping save (likely saved by another parallel job)`
        )
        return
      }

      // Target doesn't exist, proceed with rename/move
      try {
        await fs.promises.rename(`./${sourcePath}`, targetPath)
        core.info(`Cache saved with key ${key}`)
      } catch (mvError) {
        // rename failed (another job may have saved concurrently)
        core.info(
          `Failed to save cache (another job may have saved it concurrently), continuing without error`
        )
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
