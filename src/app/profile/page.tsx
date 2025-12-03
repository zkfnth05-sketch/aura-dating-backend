import Header from '@/components/layout/header';
import { currentUser } from '@/lib/data';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-8">
        <Card className="max-w-2xl mx-auto border-primary/20">
            <CardHeader className="relative p-0">
                 <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
                    <Image
                        src={currentUser.photoUrl}
                        alt={`Profile of ${currentUser.name}`}
                        fill
                        className="object-cover object-top"
                        data-ai-hint="person portrait"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                 </div>
                 <div className="absolute top-[6rem] left-6">
                    <div className="relative w-32 h-32 rounded-full border-4 border-card overflow-hidden">
                         <Image
                            src={currentUser.photoUrl}
                            alt={`Profile of ${currentUser.name}`}
                            fill
                            className="object-cover"
                            data-ai-hint="person portrait"
                        />
                    </div>
                 </div>
                 <Button variant="outline" size="icon" className="absolute top-4 right-4">
                    <Edit className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="pt-20 p-6">
                <CardTitle className="text-3xl font-bold">
                    {currentUser.name}, <span className="font-light">{currentUser.age}</span>
                </CardTitle>
                <p className="text-muted-foreground mt-1">{currentUser.location}</p>
                <p className="mt-4">{currentUser.bio}</p>

                <div className="mt-6">
                    <h3 className="font-semibold text-primary">Interests</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {currentUser.interests.map(interest => (
                            <Badge key={interest} variant="secondary">{interest}</Badge>
                        ))}
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="font-semibold text-primary">Hobbies</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {currentUser.hobbies.map(hobby => (
                            <Badge key={hobby} variant="secondary">{hobby}</Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
