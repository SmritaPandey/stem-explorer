-- Insert sample programs
INSERT INTO programs (title, description, category, age_range, price, duration, max_capacity, location, image_url)
VALUES 
  (
    'Introduction to Robotics',
    'Learn the basics of robotics and build your own simple robot. This program covers mechanical design, electronics, and programming fundamentals.',
    'Robotics',
    '8-12',
    49.99,
    120,
    15,
    'Main Campus - Room 101',
    'https://images.unsplash.com/photo-1561144257-e32e8efc6c4f'
  ),
  (
    'Coding for Kids',
    'A fun introduction to programming concepts using Scratch. Students will create their own interactive stories, games, and animations.',
    'Programming',
    '7-10',
    39.99,
    90,
    20,
    'Main Campus - Computer Lab',
    'https://images.unsplash.com/photo-1603354350317-6f7aaa5911c5'
  ),
  (
    'Advanced Python Programming',
    'Take your Python skills to the next level. Learn about object-oriented programming, data structures, and build real-world applications.',
    'Programming',
    '13-17',
    59.99,
    150,
    12,
    'Tech Center - Room 203',
    'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0'
  ),
  (
    'Chemistry Experiments',
    'Hands-on chemistry experiments that make science fun and engaging. Students will learn about chemical reactions, states of matter, and more.',
    'Science',
    '10-14',
    45.99,
    120,
    15,
    'Science Lab - Room 105',
    'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6'
  ),
  (
    'Space Exploration',
    'Discover the wonders of our solar system and beyond. Learn about planets, stars, galaxies, and the latest in space exploration technology.',
    'Astronomy',
    '9-15',
    49.99,
    120,
    25,
    'Planetarium',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa'
  ),
  (
    'Math Olympiad Preparation',
    'Prepare for math competitions with challenging problems and advanced mathematical concepts. Develop problem-solving skills and mathematical thinking.',
    'Mathematics',
    '12-16',
    54.99,
    120,
    10,
    'Main Campus - Room 202',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb'
  ),
  (
    'Environmental Science Workshop',
    'Explore ecosystems, climate change, and conservation through hands-on activities and field studies. Learn how to protect our planet.',
    'Science',
    '11-15',
    44.99,
    180,
    18,
    'Nature Center',
    'https://images.unsplash.com/photo-1464925257126-6450e871c667'
  ),
  (
    'Engineering Challenges',
    'Design and build structures to solve engineering challenges. Learn about forces, materials, and the engineering design process.',
    'Engineering',
    '10-14',
    49.99,
    150,
    15,
    'Maker Space',
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12'
  );

-- Insert sample program sessions (for the next 30 days)
DO $$
DECLARE
  program_rec RECORD;
  session_date DATE;
  start_time TIME;
  end_time TIME;
BEGIN
  FOR program_rec IN SELECT id, duration FROM programs LOOP
    FOR i IN 1..5 LOOP
      -- Generate a random date in the next 30 days
      session_date := CURRENT_DATE + (random() * 30)::INTEGER;
      
      -- Generate a random start time between 9 AM and 5 PM
      start_time := '09:00:00'::TIME + (random() * 8 * 60 * 60)::INTEGER * '1 second'::INTERVAL;
      
      -- Calculate end time based on program duration
      end_time := start_time + (program_rec.duration || ' minutes')::INTERVAL;
      
      -- Insert the session
      INSERT INTO program_sessions (program_id, start_time, end_time)
      VALUES (
        program_rec.id,
        (session_date || ' ' || start_time)::TIMESTAMP WITH TIME ZONE,
        (session_date || ' ' || end_time)::TIMESTAMP WITH TIME ZONE
      );
    END LOOP;
  END LOOP;
END $$;
