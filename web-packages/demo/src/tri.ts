import { Engine } from '@maxellabs/engine';
const container = document.getElementById('J-container');

(async () => {
  const engine = new Engine({
    container,
    interactive: true,
    onError: (err, ...args) => {
      console.error(err.message);
    },
  });
})();
