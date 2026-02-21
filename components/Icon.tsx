import React from 'react';

type IconName = 'plus' | 'bookOpen' | 'trash' | 'x' | 'externalLink' | 'chevronDown' | 'search' | 'check' | 'copy' | 'library' | 'add' | 'autorenew' | 'analytics' | 'home' | 'history' | 'person' | 'trending_up' | 'warning' | 'cloudUpload' | 'cloudDownload' | 'settings' | 'mic' | 'micOff' | 'lock' | 'logout' | 'arrowBack' | 'send' | 'notifications' | 'notificationsActive' | 'google' | 'download' | 'upload' | 'api' | 'sun' | 'moon' | 'cloudOff' | 'cloud' | 'image' | 'event' | 'delete' | 'checkCircle' | 'radioButtonUnchecked' | 'list' | 'notes' | 'autoAwesome' | 'lightbulb';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: IconName;
  className?: string;
}

const iconMap: Record<IconName, string> = {
  plus: 'add',
  add: 'add',
  bookOpen: 'menu_book',
  library: 'library_books',
  trash: 'delete',
  delete: 'delete',
  x: 'close',
  externalLink: 'open_in_new',
  chevronDown: 'expand_more',
  search: 'search',
  check: 'check',
  copy: 'content_copy',
  autorenew: 'autorenew',
  analytics: 'analytics',
  home: 'home',
  history: 'history',
  person: 'person',
  trending_up: 'trending_up',
  warning: 'warning',
  cloudUpload: 'cloud_upload',
  cloudDownload: 'cloud_download',
  settings: 'settings',
  mic: 'mic',
  micOff: 'mic_off',
  lock: 'lock',
  logout: 'logout',
  arrowBack: 'arrow_back',
  send: 'send',
  notifications: 'notifications',
  notificationsActive: 'notifications_active',
  google: 'public',
  download: 'download',
  upload: 'upload',
  api: 'api',
  sun: 'light_mode',
  moon: 'dark_mode',
  cloudOff: 'cloud_off',
  cloud: 'cloud_done',
  image: 'image',
  event: 'event',
  checkCircle: 'check_circle',
  radioButtonUnchecked: 'radio_button_unchecked',
  list: 'list',
  notes: 'notes',
  autoAwesome: 'auto_awesome',
  lightbulb: 'lightbulb'
};

const Icon: React.FC<IconProps> = ({ name, className = '', ...props }) => {
  return (
    <span className={`material-symbols-outlined ${className}`} {...props}>
      {iconMap[name]}
    </span>
  );
};

export default Icon;