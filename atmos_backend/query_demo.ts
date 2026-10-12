import { query } from './src/db/pool';

async function main() {
  try {
    // Get latest project
    const projects = await query('SELECT id, name, status FROM projects ORDER BY created_at DESC LIMIT 1');
    console.log('Latest Project:', projects.rows[0]);

    if (projects.rows[0]) {
      const projectId = projects.rows[0].id;

      // Get AI verification for this project
      const ai = await query(
        'SELECT id, project_id, co2e_estimated, confidence_score, grade FROM ai_verifications WHERE project_id = $1',
        [projectId]
      );
      console.log('\nAI Verification:', ai.rows[0]);

      // Get ZK proof
      const zk = await query(
        'SELECT id, project_id, proof_hash, verification_status FROM zk_proofs WHERE project_id = $1',
        [projectId]
      );
      console.log('\nZK Proof:', zk.rows[0]);

      // Get carbon credits
      const cc = await query(
        'SELECT id, project_id, amount_co2e FROM carbon_credits WHERE project_id = $1',
        [projectId]
      );
      console.log('\nCarbon Credits:', cc.rows[0]);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
