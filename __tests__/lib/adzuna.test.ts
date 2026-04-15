import { searchAdzuna } from '@/lib/adzuna'

const mockFetch = jest.fn()
global.fetch = mockFetch

const MOCK_RESPONSE = {
  results: [
    {
      id: 'adzuna-123',
      title: 'Senior Product Manager',
      company: { display_name: 'Google' },
      location: { display_name: 'London' },
      salary_min: 85000,
      salary_max: 110000,
      description: 'We are looking for a Senior PM...',
      redirect_url: 'https://www.adzuna.co.uk/jobs/details/123',
      contract_type: 'permanent',
      created: '2026-04-14T10:00:00Z',
    },
  ],
}

describe('searchAdzuna', () => {
  beforeEach(() => mockFetch.mockReset())

  it('returns normalised job objects', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    })

    const jobs = await searchAdzuna({ title: 'Product Manager', location: 'London' })

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      adzuna_id: 'adzuna-123',
      title: 'Senior Product Manager',
      company: 'Google',
      location: 'London',
      salary_min: 85000,
      salary_max: 110000,
    })
  })

  it('throws on Adzuna API error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 })
    await expect(searchAdzuna({ title: 'PM', location: 'London' })).rejects.toThrow('Adzuna API error: 401')
  })
})
