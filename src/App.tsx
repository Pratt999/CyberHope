import React, { useState } from 'react';
import { Shield, Upload, FileText, Users, Settings, Search } from 'lucide-react';
import { WalletConnect } from './components/WalletConnect';
import { EvidenceUpload } from './components/EvidenceUpload';
import { EvidenceList } from './components/EvidenceList';
import { AccessControl } from './components/AccessControl';
import { Settings as SettingsComponent } from './components/Settings';
import { EvidenceSearch } from './components/EvidenceSearch';

type Tab = 'upload' | 'evidence' | 'search' | 'access' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');

  const tabs = [
    { id: 'upload' as Tab, label: 'Submit Evidence', icon: Upload },
    { id: 'evidence' as Tab, label: 'My Evidence', icon: FileText },
    { id: 'search' as Tab, label: 'Search Evidence', icon: Search },
    { id: 'access' as Tab, label: 'Access Control', icon: Users },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <EvidenceUpload />;
      case 'evidence':
        return <EvidenceList />;
      case 'search':
        return <EvidenceSearch />;
      case 'access':
        return <AccessControl />;
      case 'settings':
        return <SettingsComponent />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CyberHope</h1>
                <p className="text-sm text-gray-400">Blockchain Evidence Storage</p>
              </div>
            </div>
            
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>

            {/* Info Panel */}
            <div className="mt-8 bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-white">How It Works</h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Files are encrypted before upload</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Evidence stored on IPFS network</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Blockchain ensures immutability</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Victim controls access permissions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>SecureEvidence - Protecting victims through blockchain technology</p>
            <p className="mt-1">Built with Ethereum, IPFS, and end-to-end encryption</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;