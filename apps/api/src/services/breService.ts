/**
 * Business Rule Engine (BRE)
 *
 * Runs server-side ONLY — client-side validation is optional for UX
 * but must never be the source of truth. The server is the gatekeeper.
 *
 * Rules:
 * 1. Age must be between 23 and 50
 * 2. Monthly salary must be at least ₹25,000
 * 3. PAN must match valid Indian PAN format
 * 4. Applicant must not be unemployed
 */

export interface BreInput {
  dateOfBirth: Date
  monthlySalary: number
  pan: string
  employmentMode: 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED'
}

export interface BreResult {
  passed: boolean
  errors: string[]
}

// Indian PAN format: 5 uppercase letters, 4 digits, 1 uppercase letter
// e.g., ABCDE1234F
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

function calculateAge(dob: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }

  return age
}

export function runBRE(input: BreInput): BreResult {
  const errors: string[] = []

  // Rule 1: Age between 23 and 50
  const age = calculateAge(new Date(input.dateOfBirth))
  if (age < 23 || age > 50) {
    errors.push(`Age must be between 23 and 50 (current age: ${age})`)
  }

  // Rule 2: Monthly salary >= ₹25,000
  if (input.monthlySalary < 25000) {
    errors.push(
      `Monthly salary must be at least ₹25,000 (provided: ₹${input.monthlySalary.toLocaleString('en-IN')})`
    )
  }

  // Rule 3: Valid PAN format
  if (!PAN_REGEX.test(input.pan)) {
    errors.push(
      'Invalid PAN format. PAN must be 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)'
    )
  }

  // Rule 4: Not unemployed
  if (input.employmentMode === 'UNEMPLOYED') {
    errors.push('Unemployed applicants are not eligible for a loan')
  }

  return {
    passed: errors.length === 0,
    errors,
  }
}
