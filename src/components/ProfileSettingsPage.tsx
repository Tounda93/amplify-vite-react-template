import { useEffect, useMemo, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import './ProfileSettingsPage.css';

const client = generateClient<Schema>();

type ProfileSettings = Schema['ProfileSettings']['type'];

interface ProfileSettingsPageProps {
  user: {
    signInDetails?: { loginId?: string };
    username?: string;
  } | undefined;
}

type SettingsForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  shippingStreet: string;
  shippingHouseNumber: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  birthday: string;
  gender: 'male' | 'female' | 'prefer_not_to_say' | '';
  language: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  xUrl: string;
  redditUrl: string;
  billingName: string;
  billingPhoneCountryCode: string;
  billingPhoneNumber: string;
  billingStreet: string;
  billingHouseNumber: string;
  billingCity: string;
  billingPostalCode: string;
  billingCountry: string;
  paymentProvider: string;
  paymentCardBrand: string;
  paymentCardLast4: string;
  paymentCardExpMonth: string;
  paymentCardExpYear: string;
  paymentToken: string;
};

const buildEmptyForm = (email: string): SettingsForm => ({
  firstName: '',
  lastName: '',
  email,
  phoneCountryCode: '',
  phoneNumber: '',
  shippingStreet: '',
  shippingHouseNumber: '',
  shippingCity: '',
  shippingPostalCode: '',
  shippingCountry: '',
  birthday: '',
  gender: '',
  language: 'English',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
  xUrl: '',
  redditUrl: '',
  billingName: '',
  billingPhoneCountryCode: '',
  billingPhoneNumber: '',
  billingStreet: '',
  billingHouseNumber: '',
  billingCity: '',
  billingPostalCode: '',
  billingCountry: '',
  paymentProvider: '',
  paymentCardBrand: '',
  paymentCardLast4: '',
  paymentCardExpMonth: '',
  paymentCardExpYear: '',
  paymentToken: '',
});

export default function ProfileSettingsPage({ user }: ProfileSettingsPageProps) {
  const userEmail = user?.signInDetails?.loginId || user?.username || '';
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SettingsForm>(buildEmptyForm(userEmail));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isValid = useMemo(() => {
    return Boolean(formData.firstName && formData.lastName && formData.email);
  }, [formData.firstName, formData.lastName, formData.email]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, email: userEmail || prev.email }));
  }, [userEmail]);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload?.sub as string | undefined;
        setCurrentUserId(userId ?? null);
      } catch (error) {
        console.error('Failed to load user session', error);
        setCurrentUserId(null);
      }
    };
    loadUserId();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await client.models.ProfileSettings.list({
          limit: 1,
          filter: { ownerId: { eq: currentUserId } },
        });
        const settings = data?.[0];
        if (settings?.id) {
          setSettingsId(settings.id);
          setFormData({
            firstName: settings.firstName || '',
            lastName: settings.lastName || '',
            email: settings.email || userEmail,
            phoneCountryCode: settings.phoneCountryCode || '',
            phoneNumber: settings.phoneNumber || '',
            shippingStreet: settings.shippingStreet || '',
            shippingHouseNumber: settings.shippingHouseNumber || '',
            shippingCity: settings.shippingCity || '',
            shippingPostalCode: settings.shippingPostalCode || '',
            shippingCountry: settings.shippingCountry || '',
            birthday: settings.birthday || '',
            gender: (settings.gender as SettingsForm['gender']) || '',
            language: settings.language || 'English',
            instagramUrl: settings.instagramUrl || '',
            facebookUrl: settings.facebookUrl || '',
            tiktokUrl: settings.tiktokUrl || '',
            youtubeUrl: settings.youtubeUrl || '',
            xUrl: settings.xUrl || '',
            redditUrl: settings.redditUrl || '',
            billingName: settings.billingName || '',
            billingPhoneCountryCode: settings.billingPhoneCountryCode || '',
            billingPhoneNumber: settings.billingPhoneNumber || '',
            billingStreet: settings.billingStreet || '',
            billingHouseNumber: settings.billingHouseNumber || '',
            billingCity: settings.billingCity || '',
            billingPostalCode: settings.billingPostalCode || '',
            billingCountry: settings.billingCountry || '',
            paymentProvider: settings.paymentProvider || '',
            paymentCardBrand: settings.paymentCardBrand || '',
            paymentCardLast4: settings.paymentCardLast4 || '',
            paymentCardExpMonth: settings.paymentCardExpMonth?.toString() || '',
            paymentCardExpYear: settings.paymentCardExpYear?.toString() || '',
            paymentToken: settings.paymentToken || '',
          });
        } else {
          setFormData(buildEmptyForm(userEmail));
        }
      } catch (error) {
        console.error('Failed to load profile settings', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [currentUserId, userEmail]);

  const handleSave = async () => {
    if (!currentUserId) {
      alert('User session not available.');
      return;
    }
    if (!isValid) {
      alert('Please fill in first name, last name, and email.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ownerId: currentUserId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneCountryCode: formData.phoneCountryCode.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        shippingStreet: formData.shippingStreet.trim() || undefined,
        shippingHouseNumber: formData.shippingHouseNumber.trim() || undefined,
        shippingCity: formData.shippingCity.trim() || undefined,
        shippingPostalCode: formData.shippingPostalCode.trim() || undefined,
        shippingCountry: formData.shippingCountry.trim() || undefined,
        birthday: formData.birthday || undefined,
        gender: formData.gender || undefined,
        language: formData.language || undefined,
        instagramUrl: formData.instagramUrl.trim() || undefined,
        facebookUrl: formData.facebookUrl.trim() || undefined,
        tiktokUrl: formData.tiktokUrl.trim() || undefined,
        youtubeUrl: formData.youtubeUrl.trim() || undefined,
        xUrl: formData.xUrl.trim() || undefined,
        redditUrl: formData.redditUrl.trim() || undefined,
        billingName: formData.billingName.trim() || undefined,
        billingPhoneCountryCode: formData.billingPhoneCountryCode.trim() || undefined,
        billingPhoneNumber: formData.billingPhoneNumber.trim() || undefined,
        billingStreet: formData.billingStreet.trim() || undefined,
        billingHouseNumber: formData.billingHouseNumber.trim() || undefined,
        billingCity: formData.billingCity.trim() || undefined,
        billingPostalCode: formData.billingPostalCode.trim() || undefined,
        billingCountry: formData.billingCountry.trim() || undefined,
        paymentProvider: formData.paymentProvider.trim() || undefined,
        paymentCardBrand: formData.paymentCardBrand.trim() || undefined,
        paymentCardLast4: formData.paymentCardLast4.trim() || undefined,
        paymentCardExpMonth: formData.paymentCardExpMonth ? Number(formData.paymentCardExpMonth) : undefined,
        paymentCardExpYear: formData.paymentCardExpYear ? Number(formData.paymentCardExpYear) : undefined,
        paymentToken: formData.paymentToken.trim() || undefined,
      } as Partial<ProfileSettings> & { ownerId: string };

      if (settingsId) {
        await client.models.ProfileSettings.update({
          id: settingsId,
          ...payload,
        });
      } else {
        const created = await client.models.ProfileSettings.create(payload);
        setSettingsId(created.data?.id ?? null);
      }
      alert('Profile settings saved.');
    } catch (error) {
      console.error('Failed to save profile settings', error);
      alert('Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-settings">
        <div className="profile-settings__panel">
          <p>Loading profile settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-settings">
      <div className="profile-settings__panel">
        <div className="profile-settings__header">
          <h2>Profile Settings</h2>
          <button type="button" onClick={handleSave} disabled={!isValid || saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        <section className="profile-settings__section">
          <h3>Personal Information</h3>
          <div className="profile-settings__grid">
            <label>
              First name
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </label>
            <label>
              Last name
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </label>
            <label className="profile-settings__span-2">
              Email address
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </label>
            <label>
              Phone prefix
              <input
                type="text"
                placeholder="+33"
                value={formData.phoneCountryCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, phoneCountryCode: e.target.value }))}
              />
            </label>
            <label>
              Phone number
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </label>
          </div>

          <div className="profile-settings__grid">
            <label className="profile-settings__span-2">
              Street
              <input
                type="text"
                value={formData.shippingStreet}
                onChange={(e) => setFormData((prev) => ({ ...prev, shippingStreet: e.target.value }))}
              />
            </label>
            <label>
              House number
              <input
                type="text"
                value={formData.shippingHouseNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, shippingHouseNumber: e.target.value }))}
              />
            </label>
            <label>
              City
              <input
                type="text"
                value={formData.shippingCity}
                onChange={(e) => setFormData((prev) => ({ ...prev, shippingCity: e.target.value }))}
              />
            </label>
            <label>
              Postal code
              <input
                type="text"
                value={formData.shippingPostalCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, shippingPostalCode: e.target.value }))}
              />
            </label>
            <label>
              Country
              <input
                type="text"
                value={formData.shippingCountry}
                onChange={(e) => setFormData((prev) => ({ ...prev, shippingCountry: e.target.value }))}
              />
            </label>
          </div>

          <div className="profile-settings__grid">
            <label>
              Birthday
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData((prev) => ({ ...prev, birthday: e.target.value }))}
              />
            </label>
            <label>
              Gender
              <select
                value={formData.gender}
                onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as SettingsForm['gender'] }))}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label>
              Language
              <select
                value={formData.language}
                onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
              >
                <option value="English">English</option>
              </select>
            </label>
          </div>

          <div className="profile-settings__grid">
            <label>
              Instagram
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, instagramUrl: e.target.value }))}
                placeholder="https://instagram.com/"
              />
            </label>
            <label>
              Facebook
              <input
                type="url"
                value={formData.facebookUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                placeholder="https://facebook.com/"
              />
            </label>
            <label>
              TikTok
              <input
                type="url"
                value={formData.tiktokUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, tiktokUrl: e.target.value }))}
                placeholder="https://tiktok.com/"
              />
            </label>
            <label>
              YouTube
              <input
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
                placeholder="https://youtube.com/"
              />
            </label>
            <label>
              X (Twitter)
              <input
                type="url"
                value={formData.xUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, xUrl: e.target.value }))}
                placeholder="https://x.com/"
              />
            </label>
            <label>
              Reddit
              <input
                type="url"
                value={formData.redditUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, redditUrl: e.target.value }))}
                placeholder="https://reddit.com/"
              />
            </label>
          </div>
        </section>

        <div className="profile-settings__divider" />

        <section className="profile-settings__section">
          <h3>Payments & Billing</h3>
          <div className="profile-settings__grid">
            <label>
              Billing full name
              <input
                type="text"
                value={formData.billingName}
                onChange={(e) => setFormData((prev) => ({ ...prev, billingName: e.target.value }))}
              />
            </label>
            <label>
              Billing phone prefix
              <input
                type="text"
                value={formData.billingPhoneCountryCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, billingPhoneCountryCode: e.target.value }))}
              />
            </label>
            <label>
              Billing phone number
              <input
                type="tel"
                value={formData.billingPhoneNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, billingPhoneNumber: e.target.value }))}
              />
            </label>
          </div>

          <div className="profile-settings__grid">
            <label className="profile-settings__span-2">
              Billing street
              <input
                type="text"
                value={formData.billingStreet}
                onChange={(e) => setFormData((prev) => ({ ...prev, billingStreet: e.target.value }))}
              />
            </label>
            <label>
              House number
              <input
                type="text"
                value={formData.billingHouseNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, billingHouseNumber: e.target.value }))}
              />
            </label>
            <label>
              City
              <input
                type="text"
                value={formData.billingCity}
                onChange={(e) => setFormData((prev) => ({ ...prev, billingCity: e.target.value }))}
              />
            </label>
            <label>
              Postal code
              <input
                type="text"
                value={formData.billingPostalCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, billingPostalCode: e.target.value }))}
              />
            </label>
            <label>
              Country
              <input
                type="text"
                value={formData.billingCountry}
                onChange={(e) => setFormData((prev) => ({ ...prev, billingCountry: e.target.value }))}
              />
            </label>
          </div>

          <div className="profile-settings__grid">
            <label>
              Payment provider
              <input
                type="text"
                value={formData.paymentProvider}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentProvider: e.target.value }))}
                placeholder="Stripe, Adyen, etc."
              />
            </label>
            <label>
              Card brand
              <input
                type="text"
                value={formData.paymentCardBrand}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentCardBrand: e.target.value }))}
                placeholder="Visa"
              />
            </label>
            <label>
              Card last 4
              <input
                type="text"
                maxLength={4}
                value={formData.paymentCardLast4}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentCardLast4: e.target.value }))}
                placeholder="4242"
              />
            </label>
            <label>
              Exp month
              <input
                type="text"
                value={formData.paymentCardExpMonth}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentCardExpMonth: e.target.value }))}
                placeholder="MM"
              />
            </label>
            <label>
              Exp year
              <input
                type="text"
                value={formData.paymentCardExpYear}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentCardExpYear: e.target.value }))}
                placeholder="YYYY"
              />
            </label>
            <label className="profile-settings__span-2">
              Payment token (store provider token, not raw card numbers)
              <input
                type="text"
                value={formData.paymentToken}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentToken: e.target.value }))}
                placeholder="tok_xxx"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
