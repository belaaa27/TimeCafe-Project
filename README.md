## Environment Configuration

The backend requires environment variables for database connectivity, authentication, payment processing, image storage, and frontend communication.

Create a `.env` file inside the `timecafe-backend/` directory.

### Backend Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `NODE_ENV` | Application environment |
| `CLIENT_URL` | Frontend origin allowed by CORS |
| `BACKEND_URL` | Public backend URL |
| `DB_HOST` | Database host |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `JWT_EXPIRES_IN` | JWT expiration duration |
| `CHAPA_SECRET_KEY` | Chapa payment API secret |
| `SUPERADMIN_EMAIL` | Initial superadmin email |
| `SUPERADMIN_PASSWORD` | Initial superadmin password |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Example Configuration

Use the following template and supply your own local development values:

```env
PORT=
NODE_ENV=development

CLIENT_URL=
BACKEND_URL=

DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
JWT_EXPIRES_IN=7d

CHAPA_SECRET_KEY=

SUPERADMIN_EMAIL=
SUPERADMIN_PASSWORD=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Security Guidelines

- Never commit `.env` files or real credentials to GitHub.
- Keep production credentials in Render environment settings.
- Use strong, unique passwords and JWT secrets.
- Use separate credentials for development and production.
- Do not expose payment or Cloudinary API secrets in frontend JavaScript.
