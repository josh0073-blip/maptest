/** @jest-environment jsdom */

require('../../notify-tools.js');

describe('notify tools telemetry', function () {
  beforeEach(function () {
    document.body.innerHTML = '<div id="toast-container"></div>';
    window.appTelemetry = undefined;
    window.appNotify = undefined;
  });

  test('records toast and error events in telemetry log', function () {
    const tools = window.createNotifyTools({
      toastContainer: document.getElementById('toast-container')
    });

    window.appNotify = tools.notify;
    tools.notify.warn('Storage is getting tight');
    tools.notifyFromError(new Error('Boom'), 'Fallback');

    expect(window.appTelemetry).toBeTruthy();
    expect(window.appTelemetry.events.length).toBeGreaterThanOrEqual(2);
    expect(window.appTelemetry.events[0]).toMatchObject({
      level: 'warning',
      message: 'Storage is getting tight'
    });
    expect(window.appTelemetry.events[1]).toMatchObject({
      level: 'error',
      message: 'Boom'
    });
  });

  test('global notifyFromError logs when app notify is unavailable', function () {
    window.notifyFromError(new Error('Startup failed'), 'Fallback message');

    expect(window.appTelemetry).toBeTruthy();
    expect(window.appTelemetry.last()).toMatchObject({
      level: 'error',
      message: 'Startup failed'
    });
  });
});
