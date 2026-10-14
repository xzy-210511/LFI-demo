export interface UserProfile {
  username: string;
  school: string;
  role: string;
  researchArea: string;
}

const CURRENT_USER_KEY = 'lfi-current-user';
const REGISTERED_USER_KEY = 'lfi-registered-user';

const fallbackProfile: UserProfile = {
  username: 'Guest researcher',
  school: 'University of Queensland',
  role: 'Research student',
  researchArea: 'Laser Feedback Interferometry'
};

export function saveRegisteredUser(profile: UserProfile) {
  localStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(profile));
}

export function getRegisteredUser(): UserProfile | null {
  return readProfile(REGISTERED_USER_KEY);
}

export function loginUser(username: string) {
  const registeredUser = getRegisteredUser();
  const profile: UserProfile = {
    ...fallbackProfile,
    ...registeredUser,
    username
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event('auth-change'));
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event('auth-change'));
}

export function getCurrentUser(): UserProfile | null {
  return readProfile(CURRENT_USER_KEY);
}

function readProfile(key: string): UserProfile | null {
  const value = localStorage.getItem(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as UserProfile;
  } catch {
    return null;
  }
}
