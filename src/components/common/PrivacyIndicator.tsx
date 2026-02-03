import { useAuth } from '@/contexts/AuthContext';

interface PrivacyIndicatorProps {
  type: 'interactions' | 'statistics' | 'reports' | 'shared-data';
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

export function PrivacyIndicator({
  type,
  variant = 'default',
  className = '',
}: PrivacyIndicatorProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const getContent = () => {
    switch (type) {
      case 'interactions':
        return {
          title: isAdmin ? 'All Counselor Interactions' : 'Your Private Interactions',
          description: isAdmin
            ? 'Viewing interactions from all counselors in your organization'
            : 'These interactions are private to you and not visible to other counselors',
          icon: 'lock',
        };

      case 'statistics':
        return {
          title: isAdmin ? 'Organization-Wide Statistics' : 'Your Personal Statistics',
          description: isAdmin
            ? 'Aggregated data from all counselors in your organization'
            : 'Statistics based on your interactions only - private to you',
          icon: 'chart',
        };

      case 'reports':
        return {
          title: isAdmin ? 'Organization Report Data' : 'Personal Report Data',
          description: isAdmin
            ? 'Reports include data from all counselors in your organization'
            : 'Reports will include only your private interactions',
          icon: 'document',
        };

      case 'shared-data':
        return {
          title: 'Shared Student/Contact Information',
          description:
            'Student and contact profiles are shared within your organization, but interaction history shows only your private interactions',
          icon: 'users',
        };

      default:
        return {
          title: 'Data Privacy',
          description: 'Your interaction data is private',
          icon: 'lock',
        };
    }
  };

  const content = getContent();

  const getIcon = () => {
    switch (content.icon) {
      case 'lock':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'chart':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'users':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 ${className}`}
      >
        {isAdmin ? 'All Data' : 'Private'}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="text-primary-600">{getIcon()}</div>
        <span className="font-medium text-primary-800">{content.title}</span>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-primary-50 border border-primary-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-primary-600">{getIcon()}</div>
        <div>
          <h3 className="text-sm font-semibold text-primary-800">{content.title}</h3>
          <p className="text-xs text-primary-600">{content.description}</p>
        </div>
      </div>
    </div>
  );
}
