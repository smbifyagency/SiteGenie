import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { BusinessData } from '@shared/schema';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StepServicesProps {
  form: UseFormReturn<BusinessData>;
}

export function StepServices({ form }: StepServicesProps) {
  return (
    <div className="space-y-6">
      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-tools mr-3 text-blue-500"></i>
            Services Offered
          </CardTitle>
          <CardDescription>
            List the main services your business provides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="services"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Services (one per line) *</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={6}
                    placeholder="Emergency Plumbing Repairs&#10;Drain Cleaning&#10;Water Heater Installation&#10;Pipe Replacement&#10;Bathroom Remodeling&#10;Kitchen Plumbing"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="space-y-2">
                <FormField
                  control={form.control}
                  name={`featureHeadlines.${num - 1}` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature {num} Headline</FormLabel>
                      <FormControl>
                        <Input placeholder={`Feature ${num}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`featureDescriptions.${num - 1}` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          rows={3}
                          placeholder={`Describe feature ${num}...`}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-map-marker-alt mr-3 text-red-500"></i>
            Service Areas & Locations
          </CardTitle>
          <CardDescription>
            Where do you provide your services?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="serviceAreas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Areas (one per line) *</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={5}
                    placeholder="San Francisco&#10;Oakland&#10;San Jose&#10;Fremont&#10;Hayward"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetedKeywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Keywords (one per line or comma separated)</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={6}
                    placeholder="plumber&#10;plumbing repair&#10;emergency plumber&#10;drain cleaning"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Key Facts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-award mr-3 text-purple-500"></i>
            Key Business Facts
          </CardTitle>
          <CardDescription>
            Important facts that build trust (years in business, certifications, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="keyFacts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Facts (one per line)</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={4}
                    placeholder="15+ Years Experience&#10;Trusted & Verified&#10;24/7 Emergency Service&#10;Professional Service Commitment"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}