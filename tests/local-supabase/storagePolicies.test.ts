import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'
const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.' +
  'CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const BUCKET = 'project-images'
const PASSWORD = 'phase6-local-test-password'

const createLocalClient = () =>
  createClient(LOCAL_SUPABASE_URL, LOCAL_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })

const signInFixedUser = async (email: string): Promise<SupabaseClient> => {
  const client = createLocalClient()
  const signUp = await client.auth.signUp({ email, password: PASSWORD })
  if (signUp.error !== null && !signUp.error.message.includes('already registered')) {
    throw signUp.error
  }

  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error !== null) {
    throw error
  }
  return client
}

const requireUserId = async (client: SupabaseClient): Promise<string> => {
  const { data, error } = await client.auth.getUser()
  if (error !== null || data.user === null) {
    throw error ?? new Error('Local test user is unavailable.')
  }
  return data.user.id
}

describe('local Storage policy integration', () => {
  let users: {
    userA: SupabaseClient
    userB: SupabaseClient
    userAId: string
    userBId: string
  } | null = null

  beforeAll(async () => {
    const userA = await signInFixedUser('phase6-storage-a@example.test')
    const userB = await signInFixedUser('phase6-storage-b@example.test')
    users = {
      userA,
      userB,
      userAId: await requireUserId(userA),
      userBId: await requireUserId(userB),
    }
  })

  it('isolates list, read, write, and delete behavior by owner path', async () => {
    if (users === null) {
      throw new Error('Local test users were not initialized.')
    }
    const { userA, userAId, userB, userBId } = users
    const aPath = `${userAId}/phase6/a.webp`
    const bPath = `${userBId}/phase6/b.webp`
    const webp = new Blob([new Uint8Array([82, 73, 70, 70])], { type: 'image/webp' })

    await userA.storage.from(BUCKET).remove([aPath])
    await userB.storage.from(BUCKET).remove([bPath])

    expect((await userA.storage.from(BUCKET).upload(aPath, webp)).error).toBeNull()
    expect((await userB.storage.from(BUCKET).upload(bPath, webp)).error).toBeNull()

    const ownList = await userA.storage.from(BUCKET).list(`${userAId}/phase6`)
    expect(ownList.error).toBeNull()
    expect(ownList.data?.map(({ name }) => name)).toContain('a.webp')

    const foreignList = await userB.storage.from(BUCKET).list(`${userAId}/phase6`)
    expect(foreignList.error).toBeNull()
    expect(foreignList.data).toEqual([])

    expect((await userA.storage.from(BUCKET).download(aPath)).error).toBeNull()
    expect((await userB.storage.from(BUCKET).download(aPath)).error).not.toBeNull()

    const spoofedWrite = await userA.storage
      .from(BUCKET)
      .upload(`${userBId}/phase6/spoof.webp`, webp)
    expect(spoofedWrite.error).not.toBeNull()

    await userB.storage.from(BUCKET).remove([aPath])
    expect((await userA.storage.from(BUCKET).download(aPath)).error).toBeNull()

    expect((await userA.storage.from(BUCKET).remove([aPath])).error).toBeNull()
    expect((await userA.storage.from(BUCKET).download(aPath)).error).not.toBeNull()
    await userB.storage.from(BUCKET).remove([bPath])
  })

  it('rejects disallowed MIME types and oversized objects', async () => {
    if (users === null) {
      throw new Error('Local test users were not initialized.')
    }
    const { userA, userAId } = users
    const wrongMime = await userA.storage
      .from(BUCKET)
      .upload(`${userAId}/phase6/not-webp.txt`, new Blob(['not webp'], { type: 'text/plain' }), {
        contentType: 'text/plain',
      })
    expect(wrongMime.error).not.toBeNull()

    const oversized = await userA.storage
      .from(BUCKET)
      .upload(
        `${userAId}/phase6/oversized.webp`,
        new Blob([new Uint8Array(1_572_865)], { type: 'image/webp' }),
        { contentType: 'image/webp' },
      )
    expect(oversized.error).not.toBeNull()
  })
})
