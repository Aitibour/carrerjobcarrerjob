// Silence console.error in tests unless explicitly testing for it
jest.spyOn(console, 'error').mockImplementation(() => {})
