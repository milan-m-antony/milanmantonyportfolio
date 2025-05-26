
"use client";

import ContactForm from '@/components/ContactForm';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { ContactPageDetail, SocialLink } from '@/types/supabase';
import NextImage from 'next/image'; // For social link icons

interface ContactSectionClientViewProps {
  contactDetails: ContactPageDetail | null;
  socialLinks: SocialLink[];
}

// Helper to get a Lucide icon component by name
const getLucideIcon = (iconName: string | null | undefined, DefaultIcon: LucideIcon): LucideIcon => {
  if (iconName && LucideIcons[iconName as keyof typeof LucideIcons]) {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon;
    if (typeof Icon === 'function') { // Check if it's a component
      return Icon;
    }
  }
  return DefaultIcon;
};


export default function ContactSectionClientView({ contactDetails, socialLinks }: ContactSectionClientViewProps) {
  
  const defaultContactDetails = {
    address: "123 Creative Lane, Tech City, TC 54321",
    phone: "+1 (555) 123-4567",
    phone_href: "tel:+15551234567",
    email: "milan@example.com",
    email_href: "mailto:milan@example.com",
  };

  const currentAddress = contactDetails?.address || defaultContactDetails.address;
  const currentPhone = contactDetails?.phone || defaultContactDetails.phone;
  const currentPhoneHref = contactDetails?.phone_href || defaultContactDetails.phone_href;
  const currentEmail = contactDetails?.email || defaultContactDetails.email;
  const currentEmailHref = contactDetails?.email_href || defaultContactDetails.email_href;

  const DefaultSocialIcon = LucideIcons.Link2; 

  return (
    <Card className="max-w-5xl mx-auto shadow-xl">
      <CardContent className="p-0 md:p-0 grid md:grid-cols-2 items-stretch">
        
        <div className="space-y-8 p-6 md:p-8 bg-card rounded-l-lg h-full flex flex-col">
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-6">Contact Information</h3>
            
            <div className="flex items-start gap-4 mb-4">
              <LucideIcons.MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Address</p>
                <p className="text-muted-foreground break-all">{currentAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <LucideIcons.Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Phone</p>
                <Link href={currentPhoneHref || '#'} className="text-muted-foreground hover:text-primary transition-colors break-all">
                  {currentPhone}
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <LucideIcons.Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Email</p>
                <Link href={currentEmailHref || '#'} className="text-muted-foreground hover:text-primary transition-colors break-all">
                  {currentEmail}
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-8">
            <h3 className="text-xl font-semibold text-foreground mb-6">Connect With Me</h3>
            <div className="space-y-4">
              {socialLinks && socialLinks.length > 0 ? (
                socialLinks.map((social) => {
                  return (
                    <div key={social.id} className="flex items-center gap-3">
                      {social.icon_image_url ? (
                        <div className="relative h-5 w-5 rounded-sm overflow-hidden">
                          <NextImage 
                            src={social.icon_image_url} 
                            alt={`${social.label} icon`} 
                            width={20}
                            height={20}
                            className="object-contain" // Removed dark mode filters
                          />
                        </div>
                      ) : (
                        <DefaultSocialIcon className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                      <Link href={social.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm break-all">
                        {social.display_text || social.label}
                      </Link>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">Social links not available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6 md:p-8 bg-background md:bg-card rounded-r-lg h-full flex flex-col">
          <h3 className="text-2xl font-semibold text-foreground mb-0 text-center md:text-left">Send Me a Message</h3>
          <div className="flex-grow">
            <ContactForm />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
