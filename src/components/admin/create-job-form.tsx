"use client";
import React from 'react';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createJob } from "@/actions/jobs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  company: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Location is required"),
  locationType: z.enum(["remote", "onsite", "hybrid"]),
  jobType: z.enum(["full-time", "part-time", "contract", "internship"]),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z
    .string()
    .min(20, "Requirements must be at least 20 characters"),
  salary: z.string().optional(),
  applyUrl: z.string().url("Must be a valid URL"),
  companyLogo: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type JobFormValues = z.infer<typeof jobSchema>;

export function CreateJobForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      locationType: "remote",
      jobType: "full-time",
      description: "",
      requirements: "",
      salary: "",
      applyUrl: "",
      companyLogo: "",
    },
  });

  async function onSubmit(data: JobFormValues) {
    setIsLoading(true);
    try {
      await createJob(data);
      toast.success("Job created successfully!");
      router.push("/admin/jobs");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create job";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title *</FormLabel>
              <FormControl>
                <Input placeholder="Senior Full Stack Developer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name *</FormLabel>
              <FormControl>
                <Input placeholder="TechCorp Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <FormControl>
                  <Input placeholder="San Francisco, CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="jobType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="5-10" {...field} />
                </FormControl>
                <FormDescription>
                  Salary in LPA (e.g., 5-10, 12-15)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Minimum 50 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirements *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List the required skills, experience, and qualifications..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Minimum 20 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="applyUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application URL *</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://company.com/apply/job-id"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Where candidates can apply for this job
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyLogo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Logo URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://company.com/logo.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Job
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/jobs")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
