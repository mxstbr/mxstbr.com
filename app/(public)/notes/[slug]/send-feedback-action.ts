'use server'

export async function submitFeedback(formData: FormData) {
  // Simplified: no external service integration
  // In the original, this would send to Resend/email service
  console.log('Feedback submitted:', {
    feedback: formData.get('feedback'),
    email: formData.get('email'),
    note: formData.get('note'),
  })
  
  // Return success for now
  return { success: true }
}
