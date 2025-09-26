import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Eye, Download, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

interface SettingsData {
  notifications: {
    accessRequests: boolean;
    evidenceViewed: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    showAddress: boolean;
    allowPublicProfile: boolean;
    dataRetention: number; // days
  };
  security: {
    requireConfirmation: boolean;
    autoLogout: number; // minutes
    encryptionLevel: 'standard' | 'high';
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    includeMetadata: boolean;
  };
}

const defaultSettings: SettingsData = {
  notifications: {
    accessRequests: true,
    evidenceViewed: true,
    systemUpdates: false,
  },
  privacy: {
    showAddress: false,
    allowPublicProfile: false,
    dataRetention: 365,
  },
  security: {
    requireConfirmation: true,
    autoLogout: 30,
    encryptionLevel: 'high',
  },
  backup: {
    autoBackup: true,
    backupFrequency: 'weekly',
    includeMetadata: true,
  },
};

export const Settings: React.FC = () => {
  const { account, isConnected } = useWallet();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (isConnected && account) {
      loadSettings();
    }
  }, [isConnected, account]);

  const loadSettings = () => {
    const stored = localStorage.getItem(`settings_${account}`);
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };

  const saveSettings = async () => {
    if (!account) return;

    setSaveStatus('saving');
    try {
      localStorage.setItem(`settings_${account}`, JSON.stringify(settings));
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const updateSettings = (section: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `evidence-settings-${account?.slice(0, 8)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearAllData = async () => {
    if (!account) return;
    
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem(`settings_${account}`);
      localStorage.removeItem('evidenceData');
      setSettings(defaultSettings);
      setHasChanges(false);
      alert('All data has been cleared.');
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Wallet Required</h3>
        <p className="text-gray-500">Please connect your wallet to access settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Settings</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-yellow-400 text-sm">Unsaved changes</span>
          )}
          <button
            onClick={saveSettings}
            disabled={!hasChanges || saveStatus === 'saving'}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {saveStatus === 'saving' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : saveStatus === 'saved' ? (
              <CheckCircle className="h-4 w-4" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'saved' ? 'Saved!' : 
               saveStatus === 'error' ? 'Error' : 'Save Changes'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Notifications */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Access Requests</p>
                <p className="text-gray-400 text-sm">Get notified when someone requests access to your evidence</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.accessRequests}
                  onChange={(e) => updateSettings('notifications', 'accessRequests', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Evidence Viewed</p>
                <p className="text-gray-400 text-sm">Get notified when your evidence is accessed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.evidenceViewed}
                  onChange={(e) => updateSettings('notifications', 'evidenceViewed', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">System Updates</p>
                <p className="text-gray-400 text-sm">Get notified about system updates and maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.systemUpdates}
                  onChange={(e) => updateSettings('notifications', 'systemUpdates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Eye className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Privacy</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Show Wallet Address</p>
                <p className="text-gray-400 text-sm">Display your wallet address in your profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.showAddress}
                  onChange={(e) => updateSettings('privacy', 'showAddress', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Allow Public Profile</p>
                <p className="text-gray-400 text-sm">Allow others to see your public profile information</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.allowPublicProfile}
                  onChange={(e) => updateSettings('privacy', 'allowPublicProfile', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-white mb-2">Data Retention (days)</label>
              <select
                value={settings.privacy.dataRetention}
                onChange={(e) => updateSettings('privacy', 'dataRetention', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
                <option value={-1}>Indefinite</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Security</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Require Confirmation</p>
                <p className="text-gray-400 text-sm">Require confirmation for sensitive actions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.requireConfirmation}
                  onChange={(e) => updateSettings('security', 'requireConfirmation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-white mb-2">Auto Logout (minutes)</label>
              <select
                value={settings.security.autoLogout}
                onChange={(e) => updateSettings('security', 'autoLogout', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={-1}>Never</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white mb-2">Encryption Level</label>
              <select
                value={settings.security.encryptionLevel}
                onChange={(e) => updateSettings('security', 'encryptionLevel', e.target.value as 'standard' | 'high')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Standard (AES-256)</option>
                <option value="high">High (AES-256 + RSA)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Backup & Export */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Download className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Backup & Export</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Auto Backup</p>
                <p className="text-gray-400 text-sm">Automatically backup your settings and metadata</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.backup.autoBackup}
                  onChange={(e) => updateSettings('backup', 'autoBackup', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-white mb-2">Backup Frequency</label>
              <select
                value={settings.backup.backupFrequency}
                onChange={(e) => updateSettings('backup', 'backupFrequency', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!settings.backup.autoBackup}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Include Metadata</p>
                <p className="text-gray-400 text-sm">Include evidence metadata in backups</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.backup.includeMetadata}
                  onChange={(e) => updateSettings('backup', 'includeMetadata', e.target.checked)}
                  className="sr-only peer"
                  disabled={!settings.backup.autoBackup}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
              </label>
            </div>
            
            <div className="flex space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={exportSettings}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Settings</span>
              </button>
              
              <button
                onClick={resetSettings}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Reset to Default</span>
              </button>
              
              <button
                onClick={clearAllData}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};