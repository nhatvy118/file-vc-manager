# File & VC Manager

A modern React application for secure file management with verifiable credentials. This application provides a comprehensive interface for uploading files, viewing files, creating verifiable credentials, and accessing files using VCs.

## Features

- **File Upload**: Upload files with encryption and access level controls
- **File Viewing**: View files using Content Identifiers (CIDs)
- **Verifiable Credentials**: Create and manage VCs for file access
- **VC-based Access**: Access files using verifiable credentials
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **Real-time Feedback**: Loading states, error handling, and success notifications

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **ESLint** - Code linting and formatting

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Backend API server running on `http://localhost:8080`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd file-vc-manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

The application expects the following backend API endpoints:

### File Upload
- **POST** `/api/v1/issuer/files/upload`
- Headers: `x-issuer-did`
- Body: FormData with file and metadata

### File Viewing
- **GET** `/api/v1/issuer/files/{cid}`
- Headers: `accept: application/octet-stream`, `x-issuer-did`

### VC-based File Access
- **POST** `/api/v1/viewer/files/{cid}`
- Headers: `Content-Type: application/json`, `accept: application/octet-stream`
- Body: Verifiable Credential JSON

## Usage

### 1. Upload File
1. Select the "Upload File" tab
2. Choose a file to upload
3. Configure encryption type and access level
4. Enter issuer and owner DIDs
5. Click "Upload File"

### 2. View File
1. Select the "View File" tab
2. Enter the file CID
3. Enter the issuer DID
4. Click "View File"

### 3. Create Verifiable Credential
1. Select the "Create VC" tab
2. Ensure you have uploaded a file first
3. Click "Create VC Access"
4. Copy the generated VC for later use

### 4. View File with VC
1. Select the "View by VC" tab
2. Paste the verifiable credential JSON
3. Click "View File with VC"

## Configuration

### Default DIDs
The application comes with pre-configured test DIDs:
- Issuer DID: `did:nda:testnet:0xd012ef45a753535bf3774cef3a4884115c69b9bf`
- Owner DID: `did:nda:testnet:0xfb2ea60a8c629fb0bb392479c7801a772bf8c9f9`

### Encryption Types
- ECDH-ES (default)
- AES-256

### Access Levels
- Private (default)
- Public

## Project Structure

```
src/
├── components/
│   └── FileVCManager.jsx    # Main component
├── App.jsx                  # App component
├── main.jsx                 # Entry point
└── index.css               # Global styles
```

## Development

### Adding New Features
1. Create new components in the `src/components/` directory
2. Import and use them in `FileVCManager.jsx`
3. Follow the existing code style and patterns

### Styling
- Uses Tailwind CSS for styling
- Custom colors defined in `tailwind.config.js`
- Responsive design with mobile-first approach

### State Management
- Uses React hooks for local state management
- Form state is managed with individual state objects
- Error handling with centralized error state

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository or contact the development team.
