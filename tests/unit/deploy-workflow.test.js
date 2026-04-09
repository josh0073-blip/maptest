const fs = require('fs');
const path = require('path');

describe('deploy workflow rollback support', function () {
  const workflowPath = path.join(__dirname, '../../.github/workflows/deploy.yml');
  const workflowText = fs.readFileSync(workflowPath, 'utf8');

  test('accepts a rollback SHA and checks out that commit', function () {
    expect(workflowText).toContain('rollback_sha:');
    expect(workflowText).toContain("description: 'Commit SHA to deploy (leave empty to deploy HEAD)'");
    expect(workflowText).toContain('if [ -n "${{ github.event.inputs.rollback_sha }}" ]; then');
    expect(workflowText).toContain('echo "sha=${{ github.event.inputs.rollback_sha }}" >> "$GITHUB_OUTPUT"');
    expect(workflowText).toContain('ref: ${{ steps.sha.outputs.sha }}');
  });

  test('publishes through the Pages deployment job', function () {
    expect(workflowText).toContain('actions/deploy-pages@v4');
    expect(workflowText).toContain('actions/upload-pages-artifact@v3');
    expect(workflowText).toContain('branches: [ master ]');
  });
});