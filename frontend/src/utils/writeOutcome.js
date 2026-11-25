/**
 * Require an explicit backend confirmation before the UI presents a ledger
 * write as successful. A committed write with incomplete reads stays
 * successful but carries a warning so the user does not retry blindly.
 */
export function getCommittedWriteFeedback(response, operation) {
  if (response?.writeCommitted !== true) {
    throw new Error(`The API did not confirm ${operation} was committed. Check the ledger before retrying.`)
  }

  const readbackComplete = response.readbackComplete === true
  return {
    readbackComplete,
    message: response.message || `${operation} committed on the blockchain.`,
    warning: readbackComplete
      ? null
      : (response.warning || 'The ledger accepted the transaction, but follow-up reads were incomplete. Refresh before retrying.'),
  }
}
