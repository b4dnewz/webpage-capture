import path from 'path';
import WebpageCapture from '../lib/index';

const capture = new WebpageCapture({
  debug: true,
  timeout: 0,
  waitUntil: 'networkidle0',
  outputDir: path.resolve(__dirname, '../output'),
  viewport: 'nexus-10'
});

(async () => {
  await capture.prepare();

  await capture.page.evaluateOnNewDocument(`
    localStorage.setItem('expires_at', '1539604313056');
    localStorage.setItem('refresh_token', 'UATQj_owQs3xHxppMLq--x_ECDTri8jCGS-GVyCNFB9hi');
    localStorage.setItem('access_token', '73aM5AOBP9Lo5c0nY8Duwjnof2TwLyo0');
    localStorage.setItem('id_token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9USTJSak5GUWpBeFJETTNOME16TTBFeFJrVTFNVGxDTjBOQ1JEUXhOa00wTVRNeVFUTTJRdyJ9.eyJnaXZlbl9uYW1lIjoiRmlsaXBwbyIsImZhbWlseV9uYW1lIjoiWmVyb3N0cmVzcyIsIm5pY2tuYW1lIjoiY29tbW9uLnVzZXIwMCIsIm5hbWUiOiJGaWxpcHBvIFplcm9zdHJlc3MiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDUuZ29vZ2xldXNlcmNvbnRlbnQuY29tLy1WN1lfdmxFcXRMby9BQUFBQUFBQUFBSS9BQUFBQUFBQVRray9NNjFHUEZtT0J4by9waG90by5qcGciLCJnZW5kZXIiOiJtYWxlIiwibG9jYWxlIjoiZW4iLCJ1cGRhdGVkX2F0IjoiMjAxOC0xMC0xNFQxMTo1MTo1Mi42MTdaIiwiZW1haWwiOiJjb21tb24udXNlcjAwQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczovL2I0ZG5ld3ouZXUuYXV0aDAuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTEwNDExNzIxMTgzMTg3MTU0MDI0IiwiYXVkIjoiNkFGQmowcUwzM3BqYUdPcGhxVXplMTVLZWNYRzZtbXgiLCJpYXQiOjE1Mzk1MTc5MTQsImV4cCI6MTUzOTU1MzkxNH0.bpTWVU4zfQXBVP2qYwyLETNho7yxmjxGhBwW5dPi5E5RKQfTV5745Z2X_KeVis4ytb2cpTjL9LHgDXdvHYohnh87ZFsnWL245DG3z6gtPzaqkmzl2Rk8XrNxe-gBHmT7J9PK4izjdkrdS6hDUYnSyfL0za3fklJ1XXLyzt8aAY0EqCnnSh1xTUF6nROURSOrukc9wve4UcFFrtdsSWthgZ4VZmIqolyWTPgFCp2YPwFXog9xUcbqpdxoj9Wl1wbDJ8WUEzVej9IJvgFp7QSUe_hC8h50uOE0HJOEeODOORFhPO_BGIONuqI-TfsxH-nouzRNt339OJHyi6RwA5x25w');
  `);

  try {
    await capture
      .capture([
        'http://localhost:8080/',
        'http://localhost:8080/callback',
        'http://localhost:8080/me',
        'http://localhost:8080/credits',
        'http://localhost:8080/find',
        'http://localhost:8080/non-existing-page',
        'http://localhost:8080/requests',
        'http://localhost:8080/reviews',
        'http://localhost:8080/offers',
        'http://localhost:8080/offers/pending',
        'http://localhost:8080/offers/archived'
      ]);
  } catch (e) {
    console.error(e);
  } finally {
    await capture.close();
  }
})();
