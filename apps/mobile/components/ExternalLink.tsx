import { Link, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  /** Internal route or absolute https URL opened in-app on native. */
  href: Href | string;
};

export function ExternalLink({ href, ...props }: Props) {
  const linkHref = href as Href;

  return (
    <Link
      target="_blank"
      {...props}
      href={linkHref}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          e.preventDefault();
          // Open the link in an in-app browser.
          WebBrowser.openBrowserAsync(String(href));
        }
      }}
    />
  );
}
