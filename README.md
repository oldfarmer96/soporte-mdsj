# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## API administrativa local

Las herramientas de consulta por DNI y restablecimiento de contrasena usan un
servidor local separado en `local-admin-api/`.

1. Copia `local-admin-api/.env.example` como `local-admin-api/.env`.
2. Configura el origen real del frontend, Supabase y el proveedor de DNI.
3. Ejecuta `npm install` dentro de `local-admin-api/`.
4. Inicia el servicio con `npm run dev` o compila con `npm run build` y usa
   `npm start`.

El frontend consulta `http://localhost:6300` por defecto. Para usar otra URL,
define `VITE_LOCAL_ADMIN_API_URL` antes de compilar Vite.

Endpoints esperados:

- `GET /health` responde `{ "message": "ok" }`.
- `POST /dni/lookup` recibe `{ "dni": "12345678" }`.
- `POST /users/:profileId/reset-password` restablece la contrasena al DNI.

La API local usa `DNI_API_URL` como plantilla GET con `{dni}` y envía
`DNI_API_TOKEN` como Bearer token. Los secretos pertenecen exclusivamente al
archivo `.env` del servidor local y nunca deben usar el prefijo `VITE_`.

## Administrador inicial

El seed crea de forma idempotente la cuenta administrativa con DNI `12345678`
y contrasena temporal `12345678`. La aplicación la marca como temporal y
solicita cambiarla desde el perfil. Volver a ejecutar el seed no reemplaza una
contrasena que ya fue cambiada.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
